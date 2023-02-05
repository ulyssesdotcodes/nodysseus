import * as ha from "hyperapp"
import {nolib} from "../../nodysseus"
import { node_args } from "../../util";
import { HyperappState } from "../types";
import { ChangeDisplayGraphId, Copy, CreateNode, CreateRef, DeleteNode, ExpandContract, middleware, Paste, run_h, SaveGraph, SelectNode, UpdateEdge, UpdateNode, UpdateNodeEffect } from "../util";

export const info_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-info-display"),
    dispatch: middleware,
    view: s => {
        return run_h(s.el, ['script'])
    }
});

export const infoInput = ({label, property, value, onchange, oninput, onkeydown, options, inputs, disabled}: {
  label: string,
  property: string,
  value: string,
  inputs: Record<string, string>,
  disabled?: boolean,
  options?: string[]
  onchange?: ha.Action<HyperappState, Event>,
  oninput?: ha.Action<HyperappState, Event>
  onkeydown?: ha.Action<HyperappState, Event>
}) => ha.h(
    'div',
    {
        class: 'value-input', 
    },
    [
        ha.h('label', {for: `edit-text-${property}`}, [ha.text(label)]),
        ha.h('input', {
            class: property, 
            id: `edit-text-${property}`, 
            key: `edit-text-${property}`, 
            name: `edit-text-${property}`, 
            disabled,
            list: options && options.length > 0 ? `edit-text-list-${property}` : undefined,
            oninput: oninput && ((s: any, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: (e.target as HTMLInputElement).value})}]), 
            onkeydown: onkeydown,
            onchange: onchange && ((s, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: undefined})}, [dispatch => dispatch(onchange, e)]]),
            onfocus: (state, event) => [{...state, focused: (event.target as HTMLInputElement).id}],
            onblur: (state, event) => [{...state, focused: false}],
            value: inputs[`edit-text-${property}`] ?? value
        }),
        options && options.length > 0 && ha.h('datalist', {id: `edit-text-list-${property}`}, options.map(o => ha.h('option', {value: o}))) 
    ]
)

export const infoWindow = ({node, hidden, edges_in, link_out, display_graph_id, randid, ref_graphs, html_id, copied_graph, inputs, graph_out, editing})=> {
    //const s.display_graph.id === s.display_graph_id && nolib.no.runtime.get_node(s.display_graph, s.selected[0]) && 
    const node_ref = node && node.ref ? nolib.no.runtime.get_ref(node.ref) : node;
    const description =  node_ref?.description;
    const node_arg_labels = node?.id ? node_args(nolib, display_graph_id, node.id) : [];
    return ha.h('div', {id: "node-info-wrapper"}, [ha.h('div', {class: "spacer before"}, []), ha.h(
        'div',
        { 
            class: {'node-info': true, hidden, editing, [node.ref]: !!node.ref}, 
            onfocusin: (state: any) => [{...state, editing: true}], 
            onblurout: (state: any) => [{...state, editing: false}] 
        },
        [
            ha.h('div', {class: "args"}, 
                node_arg_labels
                    .map(n => ha.h('span', {
                        class: "clickable", 
                        onclick: n.exists ? edges_in.filter(l => l.as === n.name).map(l => [SelectNode, {node_id: l.from}])[0]
                          : [CreateNode, {node: {id: randid}, child: node.id, child_as: n.name}]
                    }, [ha.text(n.exists ? n.name : `+${n.name}`)]))),
            ha.h('div', {class: "inputs"}, [
                ha.memo(node => infoInput({
                    label: "name", 
                    value: node.name, 
                    property: "name", 
                    inputs,
                    onchange: (state, payload) =>
                        (node.id !== graph_out && node.id !== "out") 
                        ? [UpdateNode, {node, property: "name", value: (payload.target as HTMLInputElement).value}]
                        : [state, [ChangeDisplayGraphId, {id: (payload.target as HTMLInputElement).value, select_out: true, display_graph_id}]],
                    options: (node.id === graph_out || node.id === "out") && ref_graphs
                }), node),
                ha.memo(node => infoInput({
                    label: "value", 
                    value: node.value, 
                    property: "value", 
                    inputs,
                    onchange: (state, payload) => [UpdateNode, {node, property: "value", value: (payload.target as HTMLInputElement).value}]}),
                  node),
                ha.memo(node => infoInput({
                    label: 'ref',
                    value: node.ref,
                    property: 'ref',
                    inputs,
                    // onchange: (state, event) => [UpdateNode, {node, property: "ref", value: event.target.value}],
                    onkeydown: (state, event) => (event as KeyboardEvent).code === "Tab" ? [UpdateNode, {node, property: "ref", value: (event.target as HTMLInputElement).value}] : state,
                    disabled: node.id === graph_out
                }), node),
                link_out && link_out.source && ha.memo(link_out => infoInput({
                    label: "edge", 
                    value: link_out.as, 
                    property: "edge",
                    inputs,
                    options: node_args(nolib, display_graph_id, link_out.to).map(na => na.name),
                    onchange: (state, payload) => [UpdateEdge, {edge: {from: link_out.from, to: link_out.to, as: link_out.as}, as: (payload.target as HTMLInputElement).value}]
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
                node.node_id !== graph_out && ha.h('div', {
                    class: "action", 
                    onclick: [ExpandContract, {node_id: node.node_id}]
                }, [ha.h('ion-icon', {name: Object.keys(node.nodes ?? {}).length > 0 ? "expand" : "contract"}), ha.text(Object.keys(node.nodes ?? {}).length > 0 ? "expand" : "collapse")]),
                Object.keys(node.nodes ?? {}).length > 0 && node.name !== '' && ha.h('div', {class: 'action', onclick: [CreateRef, {node}]}, ha.text("make ref")),
                ha.h('div', {
                    class: "action", 
                    onclick: [Copy, {cut: false, as: link_out.as}],
                    key: "copy-action"
                }, [ha.h('ion-icon', {name: 'copy-outline'}), ha.text("copy")]),
                copied_graph && ha.h('div', {
                    class: "action", 
                    onclick: [Paste, {}],
                    key: "paste-action"
                }, [ha.h('ion-icon', {name: 'paste-outline'}), ha.text("paste")]),
                node.node_id == graph_out && ha.h('div', {
                    class: "action", 
                    onclick: (state, payload) => [state, [SaveGraph, state]]
                }, [ha.h('ion-icon', {name: 'save-outline'}), ha.text("save")]),
                node.node_id !== graph_out && ha.h('div', {
                    class: "action", 
                    onclick: [DeleteNode, {
                        node_id: node.node_id
                    }]
                }, [ha.h('ion-icon', {name: 'trash-outline'}), ha.text("delete")]),
            ]),
        ]
    ), ha.h('div', {class: "spacer after"}, [])])
}
