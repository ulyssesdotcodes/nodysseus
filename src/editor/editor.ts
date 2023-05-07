import { resfetch, nolib, run, initStore, NodysseusError, nolibLib } from "../nodysseus";
import * as ha from "hyperapp";
import Fuse from "fuse.js";
import { create_randid, wrapPromise, base_graph } from "../util";
import { Edge, Graph, isNodeGraph, isNodeRef, isNodeValue, NodysseusNode } from "../types";
import { calculateLevels, ChangeEditingGraphId, Copy, CustomDOMEvent, DeleteNode, EXAMPLES, ExpandContract, FocusEffect, graph_subscription, hlib, hlibLib, isNodysseusError, keydownSubscription, listen, middleware, Paste, pzobj, refresh_graph, result_subscription, run_h, SaveGraph, SelectNode, select_node_subscription, UpdateNodeEffect } from "./util";
import { info_display, infoWindow } from "./components/infoWindow";
import { init_code_editor } from "./components/codeEditor";
import { d3Node, HyperappState, Levels } from "./types";
import { initPort, sharedWorkerRefStore, webClientStore } from "./store";
import { d3subscription, insert_node_el, link_el, node_el, UpdateSimulation } from "./components/graphDisplay";
import Autocomplete from "./autocomplete"
import generic from "src/generic";
import { SimulationNodeDatum } from "d3-force";
import { automergeRefStore } from "./automergeStore";


customElements.define("autocomplete-list", Autocomplete)

const SimulationToHyperapp = (state, payload) => [{
    ...state,
    levels: calculateLevels(payload.nodes, payload.links, state.editingGraph, state.selected),
    nodes: payload.nodes,
    links: payload.links,
    randid: create_randid(),
}, 
    [CustomDOMEvent, {html_id: state.html_id, event: 'updategraph', detail: {graph: state.editingGraph}}]
];



const Search = (state, {payload, nodes}) => {
    if(payload.key === "Escape") {
        return [{...state, search: false, search_index: 0}, [dispatch => payload.target.value = ""]]
    }

    const direction = payload.key === "Enter" ? payload.shiftKey ? -1 : 1 : 0; 
    const search_results = new Fuse<NodysseusNode>(
        nodes.map(n => Object.assign({}, n, 
            nolib.no.runtime.get_node(state.editingGraph, n.node_id), 
            nolib.no.runtime.get_edge_out(state.editingGraph, n.node_id))), 
        {keys: ['name', 'ref', 'value', 'as']}
    ).search(payload.target.value);
    const search_index = search_results.length > 0 ? (search_results.length + (state.search_index ?? 0) + direction) % search_results.length : 0; 

    return [{
            ...state, 
            search: payload.target.value, 
            search_index,
        }, search_results.length > 0 && [dispatch => requestAnimationFrame(() => dispatch(SelectNode, {node_id: search_results[search_index].item.id}))]
    ]
}


const search_el = ({search}) => ha.h('div', {id: "search"}, [
    typeof search === "string" && ha.h('input', {type: "text", onkeydown: (state: any, payload) => [Search,  {payload, nodes: state.nodes}], onblur: (state, payload) => [{...state, search: false}]}, []),
    typeof search !== "string" && ha.h('span', {class: 'material-icons-outlined graph-action', onclick: (s: any) => [{...s, search: ""}, [FocusEffect, {selector: "#search input"}]]}, [ha.text('search')]),
])


const show_error = (e, t?) => ({
    dom_type: 'div', 
    props: {class: "errors"}, 
    children: ((Array.isArray(e) ? [...(new Set(e.map(se => se).filter(em => em)))] : [e]).flatMap((e: NodysseusError) => [
        {dom_type: 'pre', props: {}, children: [
          {dom_type: 'span', props: {class: "message"}, children: [{dom_type: 'text_value', text: `${e.message}\n\n`}]},
          e.cause?.node_id && {
            dom_type: 'span', props: { 
            class: "goto", 
            onclick: [SelectNode, {node_id: e.cause.node_id.split('/')[1]}] }, 
            children: [{dom_type: "text_value", text: '>>'}]
          }
        ].filter(c => c)}
    ].filter(c => c)))
})

const result_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-result"),
    dispatch: middleware,
    view: s => {
        try{
            return run_h({dom_type: 'div', props: {id: `${html_id}-result`}, children: [s.el]});
        } catch(e) {
          try{
            return run_h({dom_type: 'div', props: {id: `${html_id}-result`}, children: [show_error(e, JSON.stringify(s.el))]});
          } catch(e) {
            return run_h({dom_type: 'div', props: {id: `${html_id}-result`}, children: [{dom_type: 'text_value', text: 'Could not show error'}]})
          }
        }
    }
})


const custom_editor_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-custom-editor-display"),
    dispatch: middleware,
    view: s => {
        return run_h(s.el, ["@js.script"])
    }
});

const refresh_custom_editor = () =>
  wrapPromise(nolib.no.runtime.get_ref("custom_editor")).then(graph => {
    if(graph) {
        // TODO: combine with update_info
        const graph = nolib.no.runtime.get_ref("custom_editor");
        wrapPromise(graph).then(graph => hlib.run(graph, graph.out, {_output: "display"}))
          .then(result => result && custom_editor_display_dispatch(() => ({el: result})))
    } else {
      console.log("should dispatch?")
        custom_editor_display_dispatch(() => ({el: {dom_type: "div", props: {}, children: []}}))
    }
    custom_editor_display_dispatch(() => ({el: {dom_type: "div", props: {}, children: []}}))
}).value

const defs = () =>ha.h('defs', {}, [
   ha.h('filter', {id: "flood-background", width: 1.2, height: 1.1, x: 0, y: 0}, [
       ha.h('feFlood', {floodColor: "#000a"}),
       ha.h('feComposite', {in: "SourceGraphic", operator: "over"})
    ]),
   ha.h('marker', {id: "arrow", refX: 8, refY: 4, markerWidth: 8, markerHeight: 8, markerUnits: "userSpaceOnUse", orient: "auto"}, [
       ha.h('polyline', {points: "1 1, 8 4, 1 8"})
    ])
])

let result_display_dispatch;
let info_display_dispatch;
let custom_editor_display_dispatch;
let code_editor;
let code_editor_nodeid;

const mutationObserverSubscription = (dispatch, {id}) => {
  const el = document.getElementById(id)
  const mutobs = new MutationObserver(obs => requestAnimationFrame(() => obs.forEach(mutrec => mutrec.addedNodes.forEach(added => {
    const publishel = (addedel) => {
      if(addedel instanceof HTMLElement){
        if(addedel.id){
          nolib.no.runtime.publish("domnodeadded", {id: addedel.id}, nolibLib)
        }
        for(let child of addedel.children) {
          publishel(child);
        }
      }
    }

    publishel(el)
  }))))
  mutobs.observe(el, {childList: true, subtree: true})
  return () => (console.log("disconnect"), mutobs).disconnect()
}


const error_nodes = (error) => error instanceof AggregateError || Array.isArray(error) || (error as AggregateError)?.errors
    ? (Array.isArray(error) ? error : error.errors)
        .map(e => isNodysseusError(e) ? e.cause.node_id : false).filter(n => n) 
    : isNodysseusError(error)
    ? [error.cause.node_id] : []; 

// generated using markdown node and help.md
const helpmd = run_h(
{"dom_type":"div","props":{"innerHTML":"<h2 id=\"welcome-to-nodysseus\">Welcome to Nodysseus!</h2>\n<p>To get started, checkout:</p>\n<ul>\n<li>the <a href=\"https://gitlab.com/ulysses.codes/nodysseus/-/tree/main/docs/guides\" target=\"_blank\" >guides</a></li>\n<li>youtube <a href=\"https://www.youtube.com/playlist?list=PLNf6veBQIZNohZk_htvTvPCB2UnEl3Tlh\" target=\"_blank\" >tutorials</a> and <a href=\"https://www.youtube.com/playlist?list=PLNf6veBQIZNpd8Djjie5W2lo70BkLZotv\" target=\"_blank\" >videos</a></li>\n<li>a reference for all the <a href=\"https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/reference/nodes.md\" target=\"_blank\" >standard</a> and <a href=\"https://gitlab.com/ulysses.codes/nodysseus/-/blob/main/docs/reference/three.md\" target=\"_blank\" >threejs</a> nodes</li>\n</ul>\n<p>Handy example files and boilerplates</p>\n<ul>\n<li><a href=\"https://nodysseus.io/#threejs_boilerplate\" target=\"_blank\" >threejs boilerplate</a>: the simplest threejs code without any objects</li>\n<li><a href=\"https://nodysseus.io/#threejs_example\" target=\"_blank\" >threejs cube</a>: a rotating cube</li>\n<li><a href=\"https://nodysseus.io/#threejs_force_attribute_example\" target=\"_blank\" >threejs force attribute</a>: instanced cubes driven by a force geometry attribute</li>\n<li><a href=\"https://nodysseus.io/#hydra_example\" target=\"_blank\" >hydra</a>: hydra synth</li>\n</ul>\n"},"children":[]}
)


const runapp = (init, load_graph, _lib) => {
        // return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
    return ha.app({
    init: [init, 
        [dispatch => requestAnimationFrame(() => {
            result_display_dispatch = result_display(init.html_id);
            info_display_dispatch = info_display(init.html_id);
            custom_editor_display_dispatch = custom_editor_display(init.html_id)
            dispatch(s => [
              {...s, result_display_dispatch, info_display_dispatch, custom_editor_display_dispatch},
              [() => {
                requestAnimationFrame(() =>  {
                  refresh_custom_editor()
                  nolib.no.runtime.change_graph(base_graph(init.editingGraph), hlibLib)
                });
              }]
            ]);
        })],
        [dispatch => wrapPromise(nolib.no.runtime.get_graph("custom_editor"))
          .then(graph => graph && hlib.run(graph, "out"))
          .then(custom_editor_result => custom_editor_result && dispatch(s => ({...s, custom_editor_result})))],
        [ChangeEditingGraphId, {id: load_graph, select_out: true, editingGraphId: undefined}],
        [UpdateSimulation, {...init, action: SimulationToHyperapp}],
        [init_code_editor, {html_id: init.html_id}],
        [dispatch => wrapPromise(nolib.no.runtime.ref_graphs()).then(rgs => dispatch(s => ({...s, refGraphs: rgs.concat(EXAMPLES)})))]
    ],
    dispatch: middleware,
    view: (s: HyperappState) => ha.h('div', {id: s.html_id}, [
        ha.h('svg', {id: `${s.html_id}-editor`, width: s.dimensions.x, height: s.dimensions.y}, [
            ha.h('g', {id: `${s.html_id}-editor-panzoom`}, 
                [ha.memo(defs, {})].concat(
                    s.nodes?.map(node => {
                        const newnode = Object.assign({}, node, s.editingGraph.nodes[node.node_id])
                        return ha.memo(node_el, ({
                            html_id: s.html_id, 
                            selected: s.selected[0] === node.node_id, 
                            error: !!error_nodes(s.error).find(e => e && e.startsWith(s.editingGraph.id + "/" + node.node_id)), 
                            selected_distance: s.show_all || !s.levels ? 0 : s.levels.distance_from_selected.get(node.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(node.node_id),
                            node_id: node.node_id,
                            node_name: newnode.name,
                            node_ref: isNodeRef(newnode) ? newnode.ref : undefined,
                            node_value: isNodeValue(newnode) ? newnode.value : undefined,
                            has_nodes: isNodeGraph(newnode) ? newnode.nodes : undefined,
                            nested_edge_count: newnode.nested_edge_count,
                            nested_node_count: newnode.nested_node_count,
                            node_parents: (s.levels as Levels).parents.get(node.node_id)
                        }))
                }) ?? []
                ).concat(
                    s.links?.map(link => ha.memo(link_el, {
                        link: Object.assign({}, link, s.editingGraph.edges[(link.source as d3Node).node_id]),
                        selected_distance: s.show_all || !s.levels ? 0 : s.levels.distance_from_selected.get((link.source as d3Node).node_id) > 3 ? 'far' : s.levels.distance_from_selected.get((link.source as d3Node).node_id),
                    })) ?? []
                ).concat(
                    s.links?.filter(link => (link.source as d3Node).node_id == s.selected[0] || (link.target as d3Node).node_id === s.selected[0])
                        .map(link => insert_node_el({link, randid: s.randid, node_el_width: s.node_el_width}))
                )
            ),
        ]),
        ha.memo(infoWindow, {
            node: Object.assign({}, s.nodes.find(n => n.node_id === s.selected[0]), s.editingGraph.nodes[s.selected[0]]),
            hidden: s.show_all,
            edges_in: s.selected_edges_in,
            link_out: Object.assign({}, s.links.find(l => (l.source as d3Node).node_id === s.selected[0]), s.editingGraph.edges[s.selected[0]]),
            editingGraph: s.editingGraph,
            editingGraphId: s.editingGraph.id,
            randid: s.randid,
            editing: s.editing,
            ref_graphs: s.refGraphs,
            html_id: s.html_id,
            copied_graph: s.copied?.graph,
            inputs: s.inputs,
            graph_out: s.editingGraph.out,
            error: s.error,
            refGraphs: s.refGraphs
        }),
        ha.h('div', {id: `${init.html_id}-custom-editor-display`}),
        ha.h('div', {id: "graph-actions", class: "actions"}, [
            search_el({search: s.search}),
            ha.h('span', {
              class: 'material-icons-outlined graph-action',
              style: {
                transformOrigin: 'center',
                transform: `rotate(${s.displayGraphId ? '0' : '45'}deg)`
              },
              onclick: (s: HyperappState) => ({
                ...s, 
                displayGraph: s.displayGraph ? false : s.editingGraph, 
                displayGraphId: s.displayGraphId ? false : s.editingGraphId
              })
            }, [ha.text('push_pin')]),
            ha.h('span', {
              class: 'material-icons-outlined graph-action',
              onclick: (s: HyperappState) => [
                {...s, norun: !s.norun}, 
                () => { nolib.no.runtime.togglePause(!s.norun) },
                s.norun && [refresh_graph, {
                  graph: s.displayGraph ?? s.editingGraph,
                  norun: !s.norun,
                  graphChanged: false,
                  result_display_dispatch: s.result_display_dispatch,
                  info_display_dispatch: s.info_display_dispatch,
                  code_editor: s.code_editor,
                  code_editor_nodeid: s.code_editor_nodeid
                }]
              ]
            }, [ha.text(s.norun ? 'play_arrow' : 'pause')]),
            ha.h('span', {
              class: 'material-icons-outlined graph-action',
              name: 'sync-outline', 
              onclick: (s: HyperappState) => [s, [dispatch => { 
                      nolib.no.runtime.delete_cache(); 
                      // nolib.no.runtime.clearListeners();
                      hlib.run(s.editingGraph, s.editingGraph.out ?? "out", {_output: "value"}, {profile: false});  
                      refresh_custom_editor()
                      requestAnimationFrame(() =>  dispatch(s => [s, [() => {
                          s.simulation.alpha(1); 
                          s.simulation.nodes([]); 
                      }, {}], [UpdateSimulation, {}]])) 
                  }, {}]]
            }, [ha.text('refresh')]),
                ha.h('span', {
                  class: 'material-icons-outlined graph-action',
                  name: 'help', 
                  onclick: (s: HyperappState) => ({...s, showHelp: true})
                }, [ha.text('question_mark')])
        ]),
        ha.h('div', {id: `${init.html_id}-result`}),
        s.showHelp && 
          ha.h('div', { 
          class: 'overlay' ,
          onclick: (s: HyperappState) => ({...s, showHelp: false})
        }, [
            ha.h('div', {
              id: "help-window",
              onclick: (s: HyperappState, e) => (e.stopPropagation(), s)
            }, [
              ha.h('div', {class: "help-actions actions"}, ha.h('span', {
                class: "material-icons-outlined graph-action",
                onclick: (s: HyperappState, event) => ({...s, showHelp: false})
              }, ha.text("close"))),
              helpmd
            ])
          ]),
        s.error && ha.h('div', {id: 'node-editor-error'}, run_h(show_error(s.error)))
    ]),
    node: document.getElementById(init.html_id),
    subscriptions: s => [
        document.getElementById(`${init.html_id}-result`) && [mutationObserverSubscription, {id: `${init.html_id}-result`}],
        [d3subscription, {action: SimulationToHyperapp, update: UpdateSimulation}], 
        [graph_subscription, {editingGraphId: s.editingGraphId, norun: s.norun}],
        [select_node_subscription, {}],
        result_display_dispatch && [result_subscription, {editingGraphId: s.editingGraphId, displayGraphId: s.displayGraphId, norun: s.norun}],
        listen("hashchange", (state, evt) => state.editingGraphId === evt.newURL.substring(evt.newURL.indexOf("#") + 1) || evt.newURL.substring(evt.newURL.indexOf("#") + 1).length === 0 ? state : [state, [ChangeEditingGraphId, {id: evt.newURL.substring(evt.newURL.indexOf("#") + 1), editingGraphId: state.editingGraphId}]]),
        [keydownSubscription, {action: (state: HyperappState, payload) => {
            if(document.getElementById("node-editor-result").contains(payload.target)) {
                return [state];
            }
            const mode = state.editing !== false ? 'editing' : state.search !== false ? 'searching' : 'graph';
            const key_input = (payload.ctrlKey ? 'ctrl_' : '') + (payload.shiftKey ? 'shift_' : '') + (payload.key === '?' ? 'questionmark' : payload.key.toLowerCase());
            let action;
            let effects = [];
            const selected = state.selected[0];
            switch(`${mode}_${key_input}`) {
                case "editing_ctrl_o": 
                case "searching_ctrl_o": 
                case "graph_ctrl_o": {
                    action = [SelectNode, {node_id: state.editingGraph.out, focus_property: 'name'}]
                    payload.stopPropagation();
                    payload.preventDefault();
                    break;
                }
                case "graph_arrowup": {
                    const parent_edges = nolib.no.runtime.get_edges_in(state.editingGraph, selected);
                    const node_id = parent_edges?.[Math.ceil(parent_edges.length / 2) - 1]?.from
                    action = node_id ? [SelectNode, {node_id}] : [state]
                    break;
                }
                case "graph_arrowdown": {
                    const child_edge = Object.values(state.editingGraph.edges).find(e => e.from === selected);
                    const node_id = child_edge?.to
                    action = node_id ? [SelectNode, {node_id}] : [state]
                    break;
                }
                case "graph_arrowleft": 
                case "graph_arrowright": {
                    const dirmult = key_input === "arrowleft" ? 1 : -1;
                    const current_node = state.nodes.find(n => n.node_id === selected);
                    if(state.levels) {
                      const siblings = state.levels.siblings.get(selected); 
                      const node_id = siblings.reduce((dist, sibling) => { 
                          const sibling_node = state.nodes.find(n => n.node_id === sibling); 
                          if(!sibling_node){ return dist } 
                          const xdist = Math.abs(sibling_node.x - current_node.x); 
                          dist = (dirmult * (sibling_node.x - current_node.x) < 0) && xdist < dist[0] ? [xdist, sibling_node] : dist; 
                          return dist
                      }, [state.dimensions.x, undefined] as [number, d3Node | undefined])?.[1]?.node_id; 
                      action = node_id ? [SelectNode, {node_id}] : [state]
                    }
                    break;
                }
                case "graph_ctrl_s": {
                    effects.push([SaveGraph, state])
                    break;
                }
                case "graph_ctrl_c": {
                    action = [Copy, {as: nolib.no.runtime.get_edge_out(state.editingGraph, state.selected[0]).as}];
                    break;
                }
                case "graph_ctrl_v": {
                    action = [Paste];
                    break;
                }
                case "graph_f": {
                    action = s => [{...s, search: ""}, [FocusEffect, {selector: "#search input"}]]; 
                    break;
                }
                case "graph_shift_enter": {
                    action = [ExpandContract, {node_id: state.selected[0]}];
                    break;
                }
                case "graph_x": {
                    action = [DeleteNode, {
                        node_id: state.selected[0]
                    }]
                    break;
                }
                case "graph_n": {
                    action = [SelectNode, { node_id: state.selected[0], focus_property: "name" }]
                    break;
                }
                case "graph_v": {
                    action = [SelectNode, { node_id: state.selected[0], focus_property: "value" }]
                    break;
                }
                case "graph_r": {
                    action = [SelectNode, { node_id: state.selected[0], focus_property: "ref" }]
                    break;
                }
                case "graph_e": {
                    action = [SelectNode, { node_id: state.selected[0], focus_property: "edge" }]
                    break;
                }
                case "graph_i": {
                    //TODO: type out inputs
                    break;
                }
                case "graph_esc": {
                    action = [state => [
                        {...state, show_all: true, focused: false, editing: false},
                        [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: true}, hlibLib))]
                    ]]
                    break;
                }
                case "graph_ctrl_z": {
                  const child_edge = Object.values(state.editingGraph.edges).find(e => e.from === selected);
                  const node_id = child_edge?.to

                  nolib.no.runtime.undo(state.editingGraphId)
                  effects.push(dispatch => requestAnimationFrame(() => dispatch(s => {
                    return ({...s, selected: nolib.no.runtime.get_ref(state.editingGraphId).nodes[s.selected[0]] ? s.selected : [node_id]})
                  })))
                  break;
                }
                case "graph_ctrl_y": {
                  const child_edge = Object.values(state.editingGraph.edges).find(e => e.from === selected);
                  const node_id = child_edge?.to
                  nolib.no.runtime.redo(state.editingGraphId)
                  effects.push(dispatch => requestAnimationFrame(() => dispatch(s => {
                    return ({...s, selected: nolib.no.runtime.get_ref(state.editingGraphId).nodes[s.selected[0]] ? s.selected : [node_id]})
                  })))
                  break;
                }
                default: {
                    nolib.no.runtime.publish('keydown', {data: key_input}, hlibLib)
                }
            }

            return action ? action : [state, ...effects];
        }}],
        listen('resize', s => [{
                ...s, 
                dimensions: {x: document.getElementById(init.html_id).clientWidth, y: document.getElementById(init.html_id).clientHeight}
            }, false && [() => nolib.no.runtime.publish('resize', {x: document.getElementById(init.html_id).clientWidth, y: document.getElementById(init.html_id).clientHeight}, hlibLib)]
        ]),
        !!document.getElementById( `${init.html_id}-editor-panzoom`) && [pzobj.init, {
            id: `${init.html_id}-editor-panzoom`, 
            action: (s, p) => [
                {...s, 
                    show_all: p.event !== 'effect_transform', 
                    editing: p.event === 'effect_transform' && s.editing, 
                    focused: p.event === 'effect_transform' && s.focused, 
                    noautozoom: p.noautozoom && !s.stopped
                },
                [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: p.event !== 'effect_transform'}, hlibLib))]
            ]
        }]
    ], 
});
}

const editor = async function(html_id, editingGraph, lib, norun) {
  // TODO: rewrite this shitty code that deals with shareworker not being defined
  let sharedWorker, nodysseusStore, ports, initQueue;
    if(typeof self.SharedWorker !== "undefined") {
      sharedWorker = new SharedWorker('./sharedWorker.js', {type: "module"})
      nodysseusStore = await webClientStore(() => sharedWorkerRefStore(sharedWorker.port));
    } else {
      ports = [];
      initQueue = [];
      nodysseusStore = await webClientStore(idb => automergeRefStore({nodysseusidb: idb, persist: true}));
    }
    let worker: Worker, workerPromise;
    initStore(nodysseusStore)
    hlib.worker = () => {
      if(!worker) {
        const workerMessageChannel = new MessageChannel();
        if(sharedWorker){
          sharedWorker.port.postMessage({kind: "addPort", port: workerMessageChannel.port1}, [workerMessageChannel.port1])
        } else {
          initPort({value: nodysseusStore.refs, initQueue}, ports, workerMessageChannel.port1)
        }
        worker = new Worker("./worker.js", {type: "module"})
        workerPromise = new Promise((res, rej) => {
          worker.addEventListener("message", msg => {
            if(msg.data.type === "started") {
              if(workerMessageChannel) {
                worker.postMessage({kind: "connect", port: workerMessageChannel.port2}, [workerMessageChannel.port2])
              }
              workerPromise = false;
              res(worker);
            }
          })
        })
      }

      if(workerPromise) {
        return workerPromise;
      }

      return worker;
    }

    const simple = generic.nodes["@templates.simple"] as unknown as Graph;
    simple.edges_in = Object.values(simple.edges).reduce((acc: Record<string, Record<string, Edge>>, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
    const url_params = new URLSearchParams(document.location.search);
    const graph_list = JSON.parse(localStorage.getItem("graph_list")) ?? [];
    const hash_graph = window.location.hash.substring(1);

        const init: HyperappState = { 
            editingGraphId: '@templates.simple',
            editingGraph: simple,
            displayGraph: false,
            displayGraphId: false,
            hash: window.location.hash ?? "",
            url_params,
            html_id,
            dimensions: {
                x: document.getElementById(html_id).clientWidth,
                y: document.getElementById(html_id).clientHeight
            },
            readonly: false, 
            norun: norun || url_params.get("norun") !== null,
            hide_types: false,
            offset: {x: 0, y: 0},
            nodes: [],
            links: [],
            focused: false,
            editing: false,
            search: false,
            show_all: false,
            show_result: false,
            node_el_width: 256,
            args_display: false,
            selected: ["out"],
            selected_edges_in: [],
            levels: false,
            error: false,
            inputs: {},
            randid: create_randid(),
            custom_editor_result: {},
            showHelp: false,
            refGraphs: []
        };

        runapp(init,  hash_graph && hash_graph !== "" ? hash_graph : graph_list?.[0] ?? '@templates.simple', lib)
}


export { editor, run }
