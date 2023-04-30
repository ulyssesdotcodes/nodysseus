import * as ha from "hyperapp"
import { Edge, Graph, isNodeGraph, isNodeRef, NodeMetadata, NodysseusNode, RefNode, ValueNode } from "src/types";
import { isNonNullChain } from "typescript";
import generic from "../../generic";
import {NodysseusError, nolib} from "../../nodysseus"
import { d3Link, d3Node, HyperappState } from "../types";
import { ChangeEditingGraphId, Copy, CreateNode, CreateRef, DeleteNode, ExpandContract, hlib, middleware, node_args, Paste, run_h, SaveGraph, SelectNode, UpdateEdge, UpdateNode, UpdateNodeEffect } from "../util";

export const info_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-info-display"),
    dispatch: middleware,
    view: s => {
        return run_h(s.el, ["@js.script"])
    }
});

export const infoInput = ({label, property, value, onchange, oninput, onkeydown, options, inputs, disabled}: {
  label: string,
  property: string,
  value: string,
  inputs: Record<string, string>,
  disabled?: boolean,
  options?: Array<string | {value: string, category?: string}>
  onchange?: ha.Action<HyperappState, {value: string}>,
  oninput?: ha.Action<HyperappState, Event>
  onkeydown?: ha.Action<HyperappState, Event>
}) => ha.h(
    'div',
    {
        class: 'value-input', 
    },
    [
        ha.h('label', {for: `edit-text-${property}`}, [ha.text(label)]),
        ha.h('autocomplete-list', {
            class: property, 
            id: `edit-text-${property}`, 
            key: `edit-text-${property}`, 
            name: `edit-text-${property}`, 
            value: inputs[`edit-text-${property}`] ?? value ?? "",
            disabled,
            onselect: (state: HyperappState, payload: CustomEvent) => [{...state, inputs: Object.assign(state.inputs, {[`edit-text-${property}`]: undefined})}, dispatch => dispatch(onchange, {value: payload.detail})],
            oninput: (s: any, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: (e.target as HTMLInputElement).value})}], 
            onblur: (state: HyperappState, event) => [{...state, focused: false}],
          },
          options && options.length > 0 && options.map(o => ha.h('option', {class: `autocomplete-item`, value: typeof o === "string" ? o : o.value, "data-category": typeof o === "string" ? undefined : o.category }, ha.text(typeof o === "string" ? o : o.value))))
    ]
)

export const infoWindow = ({node, hidden, edges_in, link_out, editingGraph, editingGraphId, randid, ref_graphs, html_id, copied_graph, inputs, graph_out, editing, error}: {
  node: d3Node,
  hidden: boolean,
  edges_in: Array<Edge>,
  link_out: Edge & d3Link,
  editingGraph: Graph,
  editingGraphId: string,
  randid: string,
  ref_graphs: Array<string>,
  html_id: string,
  copied_graph: Graph,
  inputs: Record<string, string>,
  graph_out: string,
  editing: boolean,
  error: false | NodysseusError
})=> {
    //const s.editingGraph.id === s.editingGraphId && nolib.no.runtime.get_node(s.editingGraph, s.selected[0]) && 
    const node_ref = !hidden && node && isNodeRef(node) ? nolib.no.runtime.get_ref(node.ref) : node;
    const description =  !hidden && node_ref?.description;
    const metadata: NodeMetadata | undefined = !error && hlib.run(editingGraph, node.node_id, {_output: "metadata"});
    const node_arg_labels = !hidden && node?.id ? node_args(nolib, editingGraph, node.id, metadata) : [];
    const isOut = node.id === graph_out

    return ha.h('div', {id: "node-info-wrapper"}, [ha.h('div', {class: "spacer before"}, []), ha.h(
        'div',
        { 
            class: {'node-info': true, hidden, editing, [isNodeRef(node) && node.ref.replace("@", "").replace(".", "-")]: isNodeRef(node) }, 
            onfocusin: (state: any) => [{...state, editing: true}], 
            onblurout: (state: any) => [{...state, editing: false}] 
        },
        [
            ha.h('div', {class: "args"}, 
                node_arg_labels
                    .map(n => ha.h('span', {
                        class: "clickable", 
                        onclick: n.exists 
                          ? [SelectNode, {node_id: edges_in.find(l => l.as === n.name)?.from}]
                          : [CreateNode, {node: {id: randid, ref: n.type && n.type !== "any" ?  n.type : undefined}, child: node.id, child_as: n.name}]
                    }, [ha.text(n.exists ? n.name : `+${n.name}`)]))),
            ha.h('div', {class: "inputs"}, [
                ha.memo(node => infoInput({
                    label: 'graph',
                    value: (node as RefNode).ref,
                    property: 'ref',
                    inputs,
                    options: nolib.no.runtime.refs().map(r => generic.nodes[r] ? {value: r, category: generic.nodes[r].category} : {value: r, category: r.startsWith("@") ? r.substring(1, r.indexOf('.')) : "custom"}),
                    onchange: (state, {value}) => [UpdateNode, {node, property: "ref", value}],
                    disabled: isOut 
                }), node),
                ha.memo(node => infoInput({
                    label: "value", 
                    value: (node as ValueNode).value, 
                    options: metadata?.values ?? [],
                    property: "value", 
                    inputs,
                    onchange: (state, {value}) => [UpdateNode, {node, property: "value", value: value }]}),
                  node),
                ha.memo(node => infoInput({
                    label: isNodeRef(node) && node.ref === "return" ? "name" : "comment", 
                    value: node.name, 
                    property: "name", 
                    inputs,
                    onchange: (state, {value}) =>
                        isOut 
                        ? [state, [ChangeEditingGraphId, {id: value, select_out: true, editingGraphId}]]
                        : [UpdateNode, {node, property: "name", value}],
                    options: isOut ? ref_graphs.filter(g => generic.nodes[g] ? generic.nodes[g].nodes?.[generic.nodes[g].out ?? "out"]?.ref === "return" : true) : []
                }), node),
                link_out && link_out.source && ha.memo(link_out => infoInput({
                    label: "edge", 
                    value: link_out.as, 
                    property: "edge",
                    inputs,
                    options: node_args(nolib, editingGraph, link_out.to, !error && hlib.run(editingGraph, link_out.to, {_output: "metadata"})).map(na => na.name),
                    onchange: (state, {value}) => [UpdateEdge, {edge: {from: link_out.from, to: link_out.to, as: link_out.as}, as: value}]
                }), link_out),
            ]),
            description && ha.h('div', {class: "description"}, ha.text(description)),
            ha.h('div', {
                id: `${html_id}-code-editor`, 
            }, []),
            ha.h('canvas', {
                id: `${html_id}-info-canvas`,
                class: "display-none",
                key: "node-editor-info-canvas"
            }, []),
            ha.h('div', {id: `${html_id}-info-display`}),
            ha.h('div', {class: "buttons"}, [
                !isOut && ((isNodeRef(node) && node.ref === "return") || isNodeGraph(node)) && ha.h('div', {
                    class: "action", 
                    onclick: [ExpandContract, {node_id: node.node_id}]
                }, [
                  ha.h('span', {class: 'material-icons-outlined'}, 
                  ha.text(isNodeGraph(node) ? "unfold_more" : "unfold_less")), 
                  ha.h('span', {}, ha.text(isNodeGraph(node) ? "expand" : "collapse"))
                ]),
                isNodeGraph(node) && node.name !== '' && ha.h('div', {class: 'action', onclick: [CreateRef, {node}]}, ha.text("make ref")),
                isNodeRef(node) && (!generic.nodes[node.ref] || generic.nodes[node.ref].nodes?.[generic.nodes[node.ref].out]?.ref === "return") && ha.h('div', {
                    class: "action", 
                    onclick: state => [state, [ChangeEditingGraphId, {id: node.ref, editingGraphId}]],
                    key: "open-ref-action"
                }, [ha.h('span', {class: 'material-icons-outlined'}, ha.text('code')), ha.h('span', {}, ha.text('open'))]),
                ha.h('div', {
                    class: "action", 
                    onclick: [Copy, {cut: false, as: link_out.as}],
                    key: "copy-action"
                }, [ha.h('span', {class: 'material-icons-outlined'}, ha.text("copy")), ha.h('span', {}, ha.text("copy"))]),
                copied_graph && ha.h('div', {
                    class: "action", 
                    onclick: [Paste, {}],
                    key: "paste-action"
                }, [ha.h('span', {class: 'material-icons-outlined'}, ha.text("paste")), ha.h('span', {}, ha.text("paste"))]),
                node.node_id == graph_out && ha.h('div', {
                    class: "action", 
                    onclick: (state, payload) => [state, [SaveGraph, state]]
                }, [ha.h('span', {class: 'material-icons-outlined'}, ha.text("save")), ha.h('span', {}, ha.text('save'))]),
                node.node_id !== graph_out && ha.h('div', {
                    class: "action", 
                    onclick: [DeleteNode, {
                        node_id: node.node_id
                    }]
                }, [ha.h('span', {class: 'material-icons-outlined'}, ha.text("delete")), ha.h('span', {}, ha.text('delete'))]),
            ]),
        ]
    ), ha.h('div', {class: "spacer after"}, [])])
}
