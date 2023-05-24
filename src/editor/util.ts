import * as ha from "hyperapp"
import { initStore, nodysseus_get, nolib, run, NodysseusError, nolibLib } from "../nodysseus";
import { Edge, FunctorRunnable, getRunnableGraph, getRunnableGraphId, Graph, isArgs, isNodeGraph, isNodeRef, isNodeScript, isRunnable, isTypedArg, Lib, NodeArg, NodeMetadata, NodysseusNode, RefNode, Runnable, TypedArg } from "../types";
import { base_node, base_graph, ispromise, wrapPromise, expand_node, contract_node, ancestor_graph, create_randid, compareObjects, newLib } from "../util";
import panzoom, * as pz from "panzoom";
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import { d3Link, d3Node, HyperappState, Levels, NodysseusSimulation, Property, Vector2 } from "./types";
import { UpdateGraphDisplay, UpdateSimulation, d3subscription, updateSimulationNodes, getNodes, getLinks } from "./components/graphDisplay";
import AutocompleteList from "./autocomplete";
import { parser } from "@lezer/javascript";
import {v4 as uuid, parse as uuidparse, stringify as uuidstringify} from "uuid";

export const EXAMPLES = ["threejs_example", "hydra_example", "threejs_boilerplate", "threejs_force_attribute_example", "threejs_node_example"];

export const middleware = dispatch => (ha_action, ha_payload) => {
    const is_action_array_payload = Array.isArray(ha_action) 
        && ha_action.length === 2
        && (typeof ha_action[0] === 'function' 
                || (isRunnable(ha_action[0])));

    const is_action_obj_payload = isRunnable(ha_action)
    const action = is_action_array_payload ? ha_action[0] : ha_action;
    const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {event: ha_payload} : ha_payload;

    return typeof action === 'object' && isRunnable(ha_action)
        ? dispatch((state, payload) => {
            try {
                const result = action.stateonly 
                    ? hlib.run_runnable(action, state)
                    : hlib.run_runnable(action, {state, ...payload});

                if(!result) {
                    return state;
                }

                const effects = (result.effects ?? []).filter(e => e).map(e => {
                    if(isRunnable(e)) {
                        const effect_fn = hlib.run_runnable(e);
                        // Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
                        return effect_fn;
                    }
                    return e
                });//.map(fx => ispromise(fx) ? fx.catch(e => dispatch(s => [{...s, error: e}])) : fx);

                if (ispromise(result)) {
                    // TODO: handle promises properly
                    return state;
                }

                return result.hasOwnProperty("state")
                    ? effects.length > 0 ? [result.state, ...effects] : result.state
                    : result.hasOwnProperty("action") && result.hasOwnProperty("payload") 
                    ? [result.action, result.payload]
                    : state;
            } catch(e) {
                return {...state, error: e}
            }
        }, payload)
        : dispatch(action, payload)
}

export const pzobj: {
  instance: false | pz.PanZoom,
  lastpanzoom: false | number;
  animationframe: false | number;
  centered: false | {nodeId: string, position: Vector2, initialOffset: Vector2};
  effect: (dispatch, payload) => void;
  getTransform: () => pz.Transform;
  init: (dispatch, sub_payload) => (() => void);
} = {
    centered: false,
    instance: false,
    lastpanzoom: false,
    animationframe: false,
    effect: function(dispatch, payload: Pick<HyperappState, "node_el_width" | "dimensions" | "html_id" | "simulation" | "nodeOffset"> & {node_id: string, prevent_dispatch?: boolean} ){
      requestAnimationFrame(() => {
        if(!hlib.panzoom.instance || !payload.node_id){ 
          pzobj.centered = false;
          return; 
        }


        pzobj.lastpanzoom = performance.now();
        const nodes = getNodes(payload.simulation);
        const selectedNode = nodes.find(n => n.node_id === payload.node_id);
        const selectedNodePos = {
          x: selectedNode?.x ?? 0,
          y: selectedNode?.y ?? 0,
        }
        const viewbox = findViewBox(
          nodes,
          getLinks(payload.simulation),
          payload.node_id,
          payload.node_el_width, 
          payload.html_id,
          payload.dimensions
        );
        const x = payload.dimensions.x * 0.5 - viewbox.center.x;
        const y = payload.dimensions.y * 0.5 - viewbox.center.y;
        const scale = hlib.panzoom.instance.getTransform().scale;
        hlib.panzoom.instance.moveTo(
          x - (payload.simulation?.selectedOffset?.x  ?? 0) * scale, 
          y - (payload?.simulation?.selectedOffset?.y ?? 0) * scale
        );
        hlib.panzoom.instance.zoomTo(x, y, 1 / scale)

        pzobj.centered = {
          nodeId: payload.node_id, 
          position: {x, y},
          initialOffset: payload?.simulation?.selectedOffset ?? {x: 0, y: 0}
        }

        if(!payload.prevent_dispatch) {
            if(pzobj.animationframe) {
              cancelAnimationFrame(pzobj.animationframe)
            }
            pzobj.animationframe = requestAnimationFrame(() => {
              pzobj.animationframe = false;
              dispatch((s, p) => [ 
                  { ...s, show_all: false, },
                  [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: false}, nolibLib))]
              ])
            });
        }

      })
    },
    getTransform: function() {
        const ret = (hlib?.panzoom?.instance as pz.PanZoom)?.getTransform?.();
        // if(ret){
          // console.log("pzxy", ret.x, ret.y);
        // }

        return ret;
    },
    init: function (dispatch, sub_payload) {
        hlib.panzoom.lastpanzoom = 0;
        let init = requestAnimationFrame(() => {
            hlib.panzoom.instance = panzoom(document.getElementById(sub_payload.id), {
                filterKey: () => true,
                smoothScroll: false,
                onTouch: (e) => {
                    if((e.target as HTMLElement).id.endsWith("-editor") && hlib.panzoom.lastpanzoom && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(), noautozoom: true}) 
                    }
                    return true;
                },
                beforeWheel: (e) => {
                    if((e.target as HTMLElement).id.endsWith("-editor") && hlib.panzoom.lastpanzoom && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(), noautozoom: true}) 
                    }
                    return false;
                },
                beforeMouseDown: (e) => {
                    const should_zoom  = e.buttons == 4 || e.altKey;
                    if(!should_zoom && (e.target as HTMLElement).id.endsWith("-editor")){
                        dispatch(sub_payload.action, {event: 'panstart', transform: (hlib.panzoom.instance as pz.PanZoom).getTransform(), noautozoom: true}) 
                    }
                    return should_zoom;
                }
            });
            let currentEvent: false | {offset: {x: number, y: number}} = false;
            (document.getElementById(sub_payload.id) as unknown as SVGElement).ownerSVGElement.addEventListener("pointermove", e => {
                if(e.buttons == 4 || e.altKey) {
                    if(!currentEvent) {
                        currentEvent = {
                            offset: {
                                x: e.offsetX,
                                y: e.offsetY
                            }
                        }
                    }
                    const movementSign = Math.abs(e.movementX) > Math.abs(e.movementY) ? e.movementX : -e.movementY;
                    const scaleMultiplier = 1 + movementSign * 0.01;
                    (hlib.panzoom.instance as pz.PanZoom).zoomTo(currentEvent.offset.x, currentEvent.offset.y, scaleMultiplier);
                } else {
                    currentEvent = false;
                }
            });
            (document.getElementById(sub_payload.id) as unknown as SVGElement).ownerSVGElement.addEventListener("pointerup", e => {
                currentEvent = false
            })
            hlib.panzoom.instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
            hlib.panzoom.instance.on('transform', (e) => {
            })
        });
        return () => { cancelAnimationFrame(init); (hlib.panzoom.instance as pz.PanZoom)?.dispose(); }
    }
}

// Errors from the worker don't keep instanceof
export const isNodysseusError = (e: Error) => e && (e instanceof nolib.no.NodysseusError || (e as NodysseusError).cause?.node_id)

export const update_info_display = ({fn, graph, args}, info_display_dispatch, code_editor, code_editor_nodeid, graphChanged = true) => {
    const node = nolib.no.runtime.get_node(graph, fn);

    if(!node) {
      return;
    }

    const node_ref = node && (isNodeRef(node) && nolib.no.runtime.get_ref(node.ref)) || node;
    const out_ref = node && (isNodeGraph(node) && nolib.no.runtime.get_node(node, node.out)) || (node_ref?.nodes && nolib.no.runtime.get_node(node_ref, node_ref.out));
    const node_display_el = hlib.run(graph, fn, {...args, _output: "display"}, {profile: false});
    const update_info_display_fn = display => info_display_dispatch && requestAnimationFrame(() => {
      info_display_dispatch(UpdateResultDisplay, {el: display?.dom_type ? display : ha.h('div', {})})
      requestAnimationFrame(() => {
        if(graphChanged) {
          code_editor.dispatch({
            changes:{from: 0, to: code_editor.state.doc.length, insert: isNodeScript(node) ? node.script : node.value},
            effects: [code_editor_nodeid.of(node.id)]
          })
        }
      });

    })
  wrapPromise(node_display_el).then(update_info_display_fn)
}

export const update_graph_list = graph_id => {
  const graph_list = JSON.parse(localStorage.getItem('graph_list'))?.filter(l => l !== graph_id) ?? []; 
  graph_list.unshift(graph_id); 
  localStorage.setItem('graph_list', JSON.stringify(graph_list)); 

}

type NodePositionArgs = {position: Vector2, simulation: NodysseusSimulation};

        // const x = payload.dimensions.x * 0.5 - viewbox.center.x - payload.nodeOffset.x;
export const setRootNodeXNodeY = ({position,  simulation}: NodePositionArgs) => {
  if(pzobj.centered) {
    const rt = document.querySelector(':root') as HTMLElement;
    rt.style.setProperty('--nodex',  `${Math.round(position.x + pzobj.centered.position.x - pzobj.centered.initialOffset.x + simulation.selectedOffset.x)}px`);
    rt.style.setProperty('--nodey',  `${Math.round(position.y + pzobj.centered.position.y - pzobj.centered.initialOffset.y + simulation.selectedOffset.y + 64)}px`);
  }
}

export const SetSelectedPositionStyleEffect = (_, payload: NodePositionArgs) => {
  requestAnimationFrame(() => setRootNodeXNodeY(payload))
}

export const ChangeEditingGraphId: ha.Effecter<HyperappState, {id: string, select_out: boolean, editingGraphId: string}> = (dispatch, {id, select_out, editingGraphId}) => {
    requestAnimationFrame(() => {
        const graphPromise = wrapPromise(nolib.no.runtime.refs()).then(refs => 
          EXAMPLES.includes(id) && !refs.includes(id) 
          ? fetch((console.log(`fetching ${id}`), `json/${id.replaceAll("_", "-")}.json`))
            .then(res => res.json())
            .then((g: Graph) => {
              return nolib.no.runtime.add_ref(g[0])
            }).then(g => {
              nolib.no.runtime.change_graph(g, hlibLib, []);
              return g
            })
          : nolib.no.runtime.get_ref(id, editingGraphId && nolib.no.runtime.get_ref(editingGraphId))
        )

        window.location.hash = '#' + id; 
        graphPromise
          .then(graph => dispatch(state => [
            {...state, editingGraphId: id},
            [dispatch => {
                requestAnimationFrame(() => {
                    update_graph_list(id)
                    const new_graph = graph ?? Object.assign({}, base_graph(state.editingGraph), {id});
                    if(!new_graph.edges_in) {
                        new_graph.edges_in = Object.values(new_graph.edges).reduce((acc: any, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
                    }
                    
                    nolib.no.runtime.change_graph(new_graph, hlibLib);
                    // nolib.no.runtime.removeGraphListeners(state.editingGraphId);
                    dispatch(s => {
                        const news = {...s, editingGraph: new_graph, selected: [new_graph.out], editingGraphId: new_graph.id}
                        return [news, [UpdateSimulation, {...news, clear_simulation_cache: true}], select_out && [() => {setTimeout(() => {
                          dispatch(SelectNode, {node_id: new_graph.out ?? "out"})
                        }, 100)}, {}]]
                    })
                    // if(!graph) {
                    //     wrapPromise(nolib.no.runtime.get_node(new_graph, new_graph.out))
                    //       .then(node =>{
                    //         dispatch(UpdateNode, {
                    //             node, 
                    //             property: "name", 
                    //             value: id,
                    //             editingGraph: new_graph
                    //         })
                    //       })
                    // }
                })
            }, {}],
        ]))
    })
}


export const CreateNode: ha.Action<HyperappState, {node: NodysseusNode & {id?: string}, child: string, child_as: string, parent?: Edge }> = (state, {node, child, child_as, parent}) => [
    state,
    dispatch => {
      if(!node.id) node.id = create_randid(state.editingGraph)
      nolib.no.runtime.updateGraph({
        graph: state.editingGraph, 
        addedNodes: [node as NodysseusNode],
        addedEdges:
          parent 
              ? [{from: node.id, to: child, as: parent.as}, {from: parent.from, to: node.id, as: 'arg0'}] 
              : [{from: node.id, to: child, as: child_as}], 
        removedEdges: parent ? [{from: parent.from, to: child}] : [] , 
        lib: hlibLib
      }).then(() => requestAnimationFrame(() => dispatch(SelectNode, {node_id: node.id})))
    }
];

export const DeleteNode = (state, {node_id}) => [
    state,
    [(dispatch, {node_id}) => dispatch(SelectNode, {node_id}), {node_id: graphEdgeOut(state.editingGraph, node_id).to}],
    [() => requestAnimationFrame(() => nolib.no.runtime.delete_node(state.editingGraph, node_id, hlibLib))]
]

export const ExpandContract = (state, {node_id}) => {
    const node = state.editingGraph.nodes[node_id]
    const update = node.nodes 
            ? expand_node({nolib, node_id, editingGraph: state.editingGraph})
            : contract_node({nolib, node_id, editingGraph: state.editingGraph});
    
    return [
        state,
        [dispatch => {
            requestAnimationFrame(() => {
                // Have to be the same time so the right node is selected
                dispatch(SelectNode, {node_id: update.selected[0]})
            })
        }]
    ]
}

export const CreateRef = (state, {node}) => [
    state,
    [dispatch => {
        const graph = {...base_graph(node), id: node.name, value: undefined};
        nolib.no.runtime.change_graph(base_graph(graph), hlibLib);
        save_graph(graph);
        nolib.no.runtime.add_node(state.editingGraph, {
            id: node.id,
            value: node.value,
            ref: node.name,
            name: undefined,
        }, hlibLib);
    }]
]

export const Copy = (state, {cut, as}) => {
  const graph = ancestor_graph(state.selected[0], state.editingGraph, nolib);
  const copied = {graph, root: state.selected[0], as};
  navigator?.clipboard?.writeText(JSON.stringify(copied))
  return {...state, copied};
}

export const Paste = state => [
    {...state},
    [dispatch => {
      navigator.clipboard.readText().then(clipboardContents => {
        let copied;
        try {
          copied = JSON.parse(clipboardContents)
        } catch (e) {
          copied = state.copied;
        }
        const node_id_map = {};
        nolib.no.runtime.add_nodes_edges(
          state.editingGraph, 
          Object.values(copied.graph.nodes as Array<NodysseusNode>)
            .map(n => ({...n, id: (node_id_map[n.id] = create_randid(state.editingGraph), node_id_map[n.id])})),
          Object.values(copied.graph.edges as Array<Edge>)
            .map(e => ({...e, from: node_id_map[e.from], to: node_id_map[e.to]}))
            .concat([{from: node_id_map[copied.root], to: state.selected[0], as: copied.as}]),
          [],
          [],
          hlibLib
        )
        // Object.values(state.copied.graph.nodes).forEach((n: NodysseusNode) => {
        //     const new_id = create_randid();
        //     node_id_map[n.id] = new_id;
        //     nolib.no.runtime.add_node(state.editingGraph, {...n, id: new_id}, hlib)
        // });
        // nolib.no.runtime.update_edges(
        //     state.editingGraph, 
        //     Object.values(state.copied.graph.edges)
        //         .map((e: any) => ({...e, from: node_id_map[e.from], to: node_id_map[e.to]}))
        //         .concat([{from: node_id_map[state.copied.root], to: state.selected[0], as: state.copied.as}]),
        //   [],
        //   hlib
        //     );
        requestAnimationFrame(() => dispatch(SelectNode, {node_id: node_id_map[state.copied.root], focus_property: 'edge'}))
      })
    }]
]

export const SelectNode: ha.Action<HyperappState, {
  node_id: string,
  focus_property?: Property,
  clearInitialLayout?: boolean
}> = (state, {node_id, focus_property, clearInitialLayout}) => state.editingGraph.nodes[node_id] ? [
    state.selected[0] === node_id ? clearInitialLayout && state.initialLayout ? {...state, initialLayout: false} : state : {
      ...state, 
      selected: [node_id], 
      inputs: {},
      selected_edges_in: graphEdgesIn(state.editingGraph, node_id),
      noautozoom: false,
      selectedMetadata: wrapPromise(hlib.run(state.editingGraph, node_id, {_output: "metadata"})).value,
      initialLayout: state.initialLayout && !clearInitialLayout
    },
    [pzobj.effect, {...state, node_id: node_id}],
    [UpdateGraphDisplay, {...state, selected: [node_id]}],
    focus_property && [FocusEffect, {selector: `.node-info .${focus_property}`}],
    getNodes(state.simulation).find(n => n.node_id === node_id) 
      && [SetSelectedPositionStyleEffect, {
        position: getNodes(state.simulation).find(n => n.node_id === node_id), 
        nodeOffset: state.nodeOffset, 
        dimensions: state.dimensions,
        svg_offset: pzobj.getTransform(),
        simulation: state.simulation
      }],
    node_id === state.editingGraph.out 
        ? [dispatch => state.info_display_dispatch({el: {dom_type: "div", props: {}, children: [
            {dom_type: "text_value", text: "Most recent graphs"},
            { dom_type: "ul", props: {}, children: localStorage.getItem("graph_list") 
                ? JSON.parse(localStorage.getItem("graph_list")).slice(0, 10).map(gid => ({dom_type: "li", props: {}, children: [
                    {
                        dom_type: "a", 
                        props: { href: "#", onclick: s => [s, [() => dispatch(ms => [ms, [ChangeEditingGraphId, {id: gid, editingGraphId: state.editingGraphId}]])]]}, 
                        children: [{dom_type: "text_value", text: gid}]}
                ]}))
                : []
            }
        ]}}), {}]
        : [() => update_info_display({
          fn: node_id, 
          graph: state.editingGraph, 
          args: {}
        }, state.info_display_dispatch, state.code_editor, state.code_editor_nodeid, state.selected[0] !== node_id), {}],
    state.selected[0] !== node_id && [() => nolib.no.runtime.publish("nodeselect", {data: {nodeId: node_id, graphId: state.editingGraphId}}, nolibLib), {}]
] : state;

export const CustomDOMEvent = (_, payload) => document.getElementById(`${payload.html_id}`)?.dispatchEvent(new CustomEvent(payload.event, {detail: payload.detail}))

export const FocusEffect: ha.Effecter<HyperappState, {selector: string}> = (_, {selector}) => {
  setTimeout(() => {
    const el: HTMLInputElement | AutocompleteList = document.querySelector(selector);
    if(!el){
      console.log(`couldn't find ${selector}`)
      return
    } 

    el.focus();
    if((el instanceof HTMLInputElement && el.type === "text") || el instanceof AutocompleteList) {
      el.select();
    }
  }, 100);
}

export const SaveGraph = (dispatch, payload) => save_graph(payload.editingGraph)

export const UpdateResultDisplay = (state, resel) => {
  const el = resel.el ?? resel;

  return compareObjects(el, state.el) ? state : {
    ...state,
    el
  }
}

export const UpdateNodeEffect = (_, {editingGraph, node}: {editingGraph: Graph, node: NodysseusNode}) => {
  nolib.no.runtime.add_node(editingGraph, node, hlibLib)
  const edges_in = graphEdgesIn(editingGraph, node.id);
  const nodeargs = node_args(nolib, editingGraph, node.id, hlib.run(editingGraph, node.id, {_output: "metadata"}));
  nolib.no.runtime.updateGraph({graph: editingGraph, addedNodes: [node], lib: nolibLib})
  if(edges_in.length === 1){ 
    if(nodeargs.filter(na => !na.additionalArg).length === 1) {
      const newAs = nodeargs.find(a => !a.additionalArg).name;
      if(newAs !== edges_in[0].as) {
        nolib.no.runtime.updateGraph({
          graph: editingGraph, 
          addedEdges: [{...edges_in[0], as: newAs}], 
          lib: hlibLib
        })
      }
    } else if(nodeargs.find(a => a.default)) {
      const newAs = nodeargs.map(a => a.name.split(": ")).find(e => e[1] === "default")?.[0]
      if(newAs) {
        nolib.no.runtime.updateGraph({
          graph: editingGraph, 
          addedEdges: [{...edges_in[0], as: newAs}], 
          lib: hlibLib
        })
      }
    }
  } 
}

export const UpdateNode: ha.Action<HyperappState, {node: NodysseusNode, property: string, value: string, editingGraph: Graph}> = (state, {node, property, value, editingGraph}) => [
    state,
    [UpdateNodeEffect, {
        editingGraph: editingGraph ?? state.editingGraph,
        node: Object.fromEntries(Object.entries(Object.assign({}, 
            base_node(typeof node === "string" ? (editingGraph ?? state.editingGraph).nodes[node] : node ? node : state.editingGraph.nodes[state.selected[0]]), 
            {[property]: value === "" ? undefined : value})).filter(kv => kv[1] !== undefined))
    }]
]

export const UpdateEdge: ha.Action<HyperappState, {edge: Edge, as: string}> = (state, {edge, as}) => [
    state,
    [() => nolib.no.runtime.updateGraph({
      graph: state.editingGraph, 
      addedEdges: [{...edge, as}], 
      removedEdges: [edge], 
      lib: hlibLib
    }), {}]
]

export const keydownSubscription = (dispatch, options) => {
    const handler = ev => {
        if ((ev.key === "s" || ev.key === "o") && ev.ctrlKey) {
            ev.preventDefault();
        } else if (!ev.key) {
            return;
        }

        requestAnimationFrame(() => dispatch(options.action, ev))
    };
    requestAnimationFrame(() => addEventListener('keydown', handler));
    return () => removeEventListener('keydown', handler);
}

export const refresh_graph = (dispatch, {graph, graphChanged, norun, result_display_dispatch, info_display_dispatch, code_editor, code_editor_nodeid}) => {
    if(norun ?? false) {
      return
    }

    const result = hlib.run(graph, graph.out ?? "out", {_output: "value"}, undefined, {profile: false});
    // const result = hlib.run(graph, graph.out, {});
    const display_fn = result => hlib.run(graph, graph.out ?? "out", {_output: "display"}, {profile: false});
    // const display_fn = result => hlib.run(graph, graph.out, {}, "display");
    const update_result_display_fn = display => result_display_dispatch(UpdateResultDisplay, {el: display && display.dom_type ? display : {dom_type: 'div', props: {}, children: []}})
    const update_info_display_fn = () => dispatch(s => [s, s.selected[0] !== s.editingGraph.out 
        && !s.show_all && [() => update_info_display({fn: s.selected[0], graph: s.editingGraph, args: {}}, info_display_dispatch, code_editor, code_editor_nodeid, graphChanged)]])
    wrapPromise(result)
      .then(display_fn)
      .then(update_result_display_fn)
    wrapPromise(result).then(update_info_display_fn)
    return result
}

export const result_subscription = (dispatch, {editingGraphId, displayGraphId, norun}) => {
    let animrun: false | number = false;

    const error_listener = (error) =>
        requestAnimationFrame(() => {
            dispatch(s => Object.assign({}, s, {error: s.error ? [...new Map(s.error.concat([error]).map(e => [e.cause?.node_id ? e.cause?.node_id?.split('/')[1] : uuid(), e])).values()] : [error]}))
        });

    nolib.no.runtime.addListener('grapherror', 'update_hyperapp_error', error_listener);

    let info_display_dispatch, code_editor, code_editor_nodeid, result_display_dispatch;

    const change_listener = ({graph}) => {
      if(animrun) {
          cancelAnimationFrame(animrun)
      }

      if(info_display_dispatch && code_editor && code_editor_nodeid && result_display_dispatch) {
        animrun = requestAnimationFrame(() => {
          if(graph.id === (displayGraphId || editingGraphId)) {
          wrapPromise(nolib.no.runtime.get_ref(displayGraphId || editingGraphId))
            .then(graph => {
                const result = refresh_graph(dispatch, {graph, graphChanged: false, norun, info_display_dispatch, code_editor, code_editor_nodeid, result_display_dispatch})
                const reset_animrun = () => animrun = false;
                wrapPromise(result, reset_animrun as () => any).then(reset_animrun)
              })
          }
        });
      } else {
        // TODO: hacky change this
        dispatch(s => [s, () => {
          info_display_dispatch = s.info_display_dispatch;
          code_editor = s.code_editor;
          code_editor_nodeid = s.code_editor_nodeid;
          result_display_dispatch = s.result_display_dispatch;
        }])
      }
    }

    nolib.no.runtime.addListener('graphupdate', 'clear_hyperapp_error', change_listener);
    const timeouts: Record<string, false | {id: ReturnType<typeof setTimeout>, timestamp: number}>  = {}
    const animframes = {}

    const noderun_listener = (data) => {
        if (data.graph.id === editingGraphId){
          const node_id = data.node_id;
          const timeout = timeouts[node_id]
          const nodeanimframe = animframes[node_id];
          if(!timeout) {
              const el = document.querySelector(`#node-editor-${data.node_id.replaceAll("/", "_")} .shape`)
              el?.classList.add("flash")
          }

          if(!timeout || performance.now() - timeout.timestamp > 950) {
            if(timeout) {
              clearTimeout(timeout.id);
            }
            timeouts[node_id] = {
              id: setTimeout(() => {
                  const el = document.querySelector(`#node-editor-${data.node_id.replaceAll("/", "_")} .shape`)
                  timeouts[node_id] = false
                  el?.classList.remove("flash");
              }, 1000),
              timestamp: performance.now()
            }
          }
        }
    }

    nolib.no.runtime.addListener('noderun', 'update_hyperapp_error', noderun_listener);

    return () => (
        nolib.no.runtime.removeListener('graphupdate', 'clear_hyperapp_error'),
        nolib.no.runtime.removeListener('grapherror', 'update_hyperapp_error')
    );
}



export const graph_subscription = (dispatch: ha.Dispatch<HyperappState>, props) => {
    let animframe: false | number = false;
    const listener = ({graph}) => {
        dispatch(s => s.error ? Object.assign({}, s, {error: false}) : s)
        wrapPromise(nolib.no.runtime.refs())
          .then(rgs => rgs.concat(EXAMPLES))
          .then(refGraphs => dispatch(s => s.refGraphs.length !== refGraphs.length ? {...s, refGraphs} : s))
        if(props.editingGraphId === graph.id) {
          if(animframe){
            cancelAnimationFrame(animframe)
          }
          animframe = requestAnimationFrame(() =>  {
              animframe = false;
              dispatch((s: HyperappState) => [{...s, editingGraph: graph}, UpdateSimulation, [refresh_graph, {
                graph: s.displayGraph || graph, 
                norun: props.norun, 
                graphChanged: true, 
                result_display_dispatch: s.result_display_dispatch,
                info_display_dispatch: s.info_display_dispatch,
                code_editor: s.code_editor,
                code_editor_nodeid: s.code_editor_nodeid
              }]])
          })
        } else {
          // Have to keep this so that other tabs updating graphs makes changes
          animframe = requestAnimationFrame(() =>  {
              animframe = false;
              dispatch((s: HyperappState) => [s, UpdateSimulation, [refresh_graph, {
                graph: s.displayGraph || s.editingGraph, 
                norun: props.norun, 
                graphChanged: true, 
                result_display_dispatch: s.result_display_dispatch,
                info_display_dispatch: s.info_display_dispatch,
                code_editor: s.code_editor,
                code_editor_nodeid: s.code_editor_nodeid
              }]])
          })

        }
    };

    nolib.no.runtime.addListener('graphchange', 'update_hyperapp', listener);
    return () => nolib.no.runtime.removeListener('graphchange', 'update_hyperapp');
}

export const select_node_subscription = (dispatch, props) => {
    const listener = (data) => {
        dispatch(SelectNode, { node_id: data.data.substring(data.data.indexOf("/") + 1) })
    }

    nolib.no.runtime.addListener("selectnode", 'hyperapp', listener);
    return () => nolib.no.runtime.removeListener('selectnode', 'hyperapp');
}

export const listen = (type, action): ha.Subscription<HyperappState, any>  => [listenToEvent, {type, action}]

export const listenToEvent = (dispatch, props): (() => void) => {
    const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event))

    requestAnimationFrame(() => addEventListener(props.type, listener));
    return () => removeEventListener(props.type, listener);
}



export const run_h = ({dom_type, props, children, text}: {dom_type: string, props: {}, children: Array<any>, text?: string}, exclude_tags=[]) => {
    return dom_type === "text_value" 
        ? ha.text(text) 
        : ha.h(dom_type, props, children?.map(c => c.el ?? c).filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}

export const runh = el => el.d && el.p && el.c && ha.h(el.d, el.p, el.c);

export const findViewBox = (nodes: Array<d3Node>, links: Array<d3Link>, selected: string, node_el_width: number, htmlid: string, dimensions: {x: number, y: number}) => {
    const visible_nodes: Array<{x: number, y: number}> = [];
    const visible_node_set = new Set();
    let selected_pos: Vector2;
    links.forEach(l => {
        const el = document.getElementById(`link-${(l.source as d3Node).node_id}`);
        const info_el = document.getElementById(`edge-info-${(l.source as d3Node).node_id}`);
        if(el && info_el && l.source && l.target) {
            const source = {x: (l.source as d3Node).x - node_el_width * 0.5, y: (l.source as d3Node).y};
            const target = {x: (l.target as d3Node).x - node_el_width * 0.5, y: (l.target as d3Node).y};

            if ((l.source as d3Node).node_id === selected) {
                visible_nodes.push({x: target.x, y: target.y});
                visible_node_set.add((l.target as d3Node).node_id);
            } else if ((l.target as d3Node).node_id === selected) {
                visible_nodes.push({x: source.x, y: source.y});
                visible_node_set.add((l.source as d3Node).node_id);
            }
        }
    });

    links.forEach(l => {
        if(visible_node_set.has((l.target as d3Node).node_id) && !visible_node_set.has((l.source as d3Node).node_id)) {
            const source = {x: (l.source as d3Node).x - node_el_width * 0.5, y: (l.source as d3Node).y};
            visible_nodes.push({x: source.x, y: source.y});
        }
    });

    nodes.forEach(n => {
        const el = document.getElementById(`${htmlid}-${n.node_id}`);
        if(el) {
            const x = n.x - node_el_width * 0.5;
            const y = n.y ;

            if(n.node_id === selected) {
                visible_nodes.push({x, y})
                selected_pos = {x, y};
            }
        }
    });

    const nodes_box = visible_nodes.reduce(
      (acc: {min: {x: number, y: number}, max: {x: number, y: number}}, n) => 
        ({min: {x: Math.min(acc.min.x, n.x - 24), y: Math.min(acc.min.y, n.y - 24)}, max: {x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24), y: Math.max(acc.max.y, n.y + 24)}}), 
        {min: {x: selected_pos ? (selected_pos.x - 96) : dimensions.x , y: selected_pos ? (selected_pos.y - 256) : dimensions.y}, max: {x: selected_pos ? (selected_pos.x + 96) : -dimensions.x, y: selected_pos ? (selected_pos.y + 128) : -dimensions.y}})
    const nodes_box_center = {x: (nodes_box.max.x + nodes_box.min.x) * 0.5, y: (nodes_box.max.y + nodes_box.min.y) * 0.5}; 
    const nodes_box_dimensions = {x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, (nodes_box.max.x - nodes_box.min.x))), y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, (nodes_box.max.y - nodes_box.min.y)))}
    const center = !selected_pos ? nodes_box_center : {x: (selected_pos.x + nodes_box_center.x * 3) * 0.25, y: (selected_pos.y + nodes_box_center.y * 3) * 0.25}

    return {nodes_box_dimensions, center};
}

export const bfs = (graph: Graph, fn) => {
    const visited = new Set();
    const iter = (id, level) => {
        if (visited.has(id)) {
            return;
        }

        fn(id, level);

        visited.add(id);

        for (const e of Object.values(graph.edges)) {
            if (e.to === id) {
                iter(e.from, level + 1);
            }
        }
    }

    return iter;
}


export const calculateLevels = (nodes: Array<d3Node>, links: Array<d3Link>, graph: Graph, selected: string): Levels => {
    const find_childest = n => {
        const e = graphEdgeOut(graph, n);
        if (e && !ispromise(e)) {
            return find_childest(e.to);
        } else {
            return n;
        }
    }
    selected = selected[0];
    const top = find_childest(selected);

    const levels = new Map();
    bfs(graph, (id, level) => levels.set(id, Math.min(levels.get(id) || Number.MAX_SAFE_INTEGER, level)))(top, 0);

    const parents = new Map(
      nodes.map(n => [
        n.node_id, 
        links.filter(l => typeof l.target == "object" ? l.target.node_id === n.node_id : l.target === n.node_id)
        .map(l => typeof l.source === "object" ? l.source.node_id  : String(l.source))
      ]));

    [...parents.values()].forEach(nps => {
        nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
        for (let i = 0; i < nps.length * 0.5; i++) {
            if (i % 2 === 1) {
                const tmp = nps[i];
                const endidx = nps.length - 1 - Math.floor(i / 2)
                nps[i] = nps[endidx];
                nps[endidx] = tmp;
            }
        }
    })

    const children = new Map(nodes
        .map(n => [n.node_id,
        links.filter(l => (typeof l.source === "object" ? l.source.node_id : l.source) === n.node_id)
            .map(l => typeof l.target === "object" ? l.target.node_id : String(l.target))
        ]));
    const siblings = new Map(nodes.map(n => [n.node_id, [...(new Set(children.has(n.node_id)? children.get(n.node_id).flatMap(c => parents.get(c) || []) : [])).values()]]))
    const distance_from_selected = new Map();

    const calculate_selected_graph = (s, i) => {
        const id = s;
        if (distance_from_selected.get(id) <= i) {
            return;
        }

        distance_from_selected.set(id, i);
        if(parents.has(s)) {
            parents.get(s).forEach(p => { calculate_selected_graph(p, i + 1); });
        }
        if(children.has(s)){
            children.get(s).forEach(c => { calculate_selected_graph(c, i + 1); });
        }
    }

    calculate_selected_graph(selected, 0);

    return {
        level_by_node: levels,
        parents,
        children,
        siblings,
        distance_from_selected,
        min: Math.min(...levels.values()),
        max: Math.max(...levels.values()),
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {}),
    }
}

const parseTypedArg = (value: string): [string, TypedArg] => {
  const argColon = value.includes(":") && [value.substring(0, value.indexOf(":")), value.substring(value.indexOf(":") + 1)].map(v => v.trim());
  const outName = (argColon[0] ?? value).includes('.') ? (argColon[0] ?? value).split('.')[0] : (argColon[0] ?? value);
  if(!argColon) return [outName, "any"]
  if(argColon[1] === "internal") return [outName, {type: "any", local: true}]
  if(argColon[1] === "default") return [outName, {type: "any", default: true}]
  try {
    return [outName, JSON.parse(argColon[1])]
  }catch(e){
    console.error("Error parsing arg type", e)
  }

  return [outName, "any"]
}

export const node_args = (nolib: Record<string, any>, graph: Graph, node_id: string, metadata: NodeMetadata): Array<NodeArg> => {
    const node = nolib.no.runtime.get_node(graph, node_id);
    if(!node) {
        // between graph update and simulation update it's possible links are bad
        return []
    }
    const node_ref = node?.ref ? nolib.no.runtime.get_ref(node.ref) : node;
    const edges_in = graphEdgesIn(graph, node_id);
    const edge_out = graphEdgeOut(graph, node_id)
    if(ispromise(edges_in) || ispromise(edge_out)) {
      return []
    }
    const node_out = edge_out && edge_out.as === "parameters" && nolib.no.runtime.get_node(graph, edge_out.to);
    const node_out_args: Array<[string, string]> = node_out?.ref === "@flow.runnable" && 
      Object.values(ancestor_graph(node_out.id, graph, nolib).nodes)
        .filter(isNodeRef)
        .filter(n => n.ref === "arg")
        .map(a => a.value?.includes(".") 
          ? a.value?.substring(0, a.value?.indexOf(".")) : a.value)
        .map(a => [a, "any"]);

    // const argslist_path = node_ref?.nodes && nolib.no.runtime.get_path(node_ref, "argslist");

    const nextIndexedArg = "arg" + ((
        edges_in?.filter(l => l.as?.startsWith("arg") && new RegExp("[0-9]+").test(l.as.substring(3)))
                .map(l => parseInt(l.as.substring(3))) ?? [])
            .reduce((acc, i) => acc > i ? acc : i + 1, 0))
    
    const externfn = node_ref?.ref === "extern" && nodysseus_get(nolib, node_ref?.value, newLib(nolib))
    const externArgs = externfn && (Array.isArray(externfn.args) ? externfn.args.map(a => {
      const argColonIdx = a.indexOf(":")
      return [argColonIdx >= 0 ? a.substring(0, argColonIdx) : a, "any"]
    }) : Object.entries(externfn.args));
    const baseargs: Array<[string ,TypedArg]> = externfn
            ? externArgs
              ? externArgs
              : ['args']
            : isNodeGraph(node_ref)
            ? Object.values(node_ref?.nodes)
                .filter(isNodeRef)
                .filter(n => n.ref === "arg")
                .map<[string, TypedArg]>(n => parseTypedArg(n.value))
                .filter(a => typeof a[1] === "string" || !a[1].local)?? []
            : []

    const scriptVarNames = node.ref === "@js.script" && new Set<string>();
    if(node.ref === "@js.script" && typeof node.value === "string") {
      const scriptVarDecs = node.ref === "@js.script" && new Set<string>();
      parser.parse(node.value).iterate({
        enter: syntaxNode => syntaxNode.name === "VariableName" && !window[node.value.substring(syntaxNode.from, syntaxNode.to)]
          ? !!scriptVarNames.add(node.value.substring(syntaxNode.from, syntaxNode.to))
          : syntaxNode.name === "VariableDeclaration" && syntaxNode.node.getChild("VariableDefinition")
          ? !!scriptVarDecs.add(node.value.substring(
            syntaxNode.node.getChild("VariableDefinition").from,
            syntaxNode.node.getChild("VariableDefinition").to
          ))
          : undefined
      })
      scriptVarDecs.forEach(dec => scriptVarNames.delete(dec));
    }

    if(
      isNodeGraph(node_ref) 
      && (node_ref.nodes[node_ref.out ?? "out"] as RefNode).ref === "return" 
      && Object.values(node_ref.edges_in ? node_ref.edges_in[node_ref.out ?? "out"] : Object.values(node_ref.edges).filter(e => e.to === node_ref.out ?? "out")).find(e => e.as === "metadata")
    ) {
      if(metadata.parameters) {
        Object.entries(metadata.parameters).forEach(pe => baseargs.push([pe[0], isTypedArg(pe[1]) ? pe[1] : "any"]))
      }
    }

    const typedArgsMap = new Map(
      edges_in?.map<[string, TypedArg]>(e => [e.as, {type: "any", additionalArg: !baseargs.map(a => a[0]).includes(e.as)}])
        .concat(baseargs)
        .filter((a: [string, TypedArg]) => !a[0].includes('.') && !a[0].startsWith("_"))
        .concat(
            (externArgs && externArgs.map(a => a[0]).includes("_node_args") || baseargs.map(a => a[0]).includes("_args"))
            || (node.ref === undefined && !node.value)
            ? [[nextIndexedArg, {type: "any", additionalArg: true}]]
            : []
        )
        .concat(node_out_args ? node_out_args : [])
        .concat(scriptVarNames ? [...scriptVarNames].map(n => [n, "any"]) : []))

    return [...typedArgsMap]
      .map((a: [string, TypedArg]) => ({
        exists: !!edges_in?.find(e => e.as === a[0]), 
        name: a[0], ...(typeof a[1] === "object" ? a[1] : {type: a[1]})
      }))
}

export const save_graph = graph => {
  graph = base_graph(graph);
  const graphstr = JSON.stringify(base_graph(graph)); 
  // localStorage.setItem(graph.id, graphstr); 
  nolib.no.runtime.add_ref(graph);
}


// Graph helpers - these are here to operate on graph objects instead of nolib which uses the store

export const graphEdgeOut = (graph: Graph, node: string) => graph.edges[node];
export const graphEdgesIn = (graph: Graph, node: string) => 
  graph["edges_in"]
    ? Object.hasOwn(graph.edges_in, node)
      ? Object.values(graph.edges_in[node])
      : []
    : Object.values(graph.edges).filter(e => e.to === node);


export const hlib = {
    ...nolib,
    ha: { 
        middleware, 
        h: {
            args: ['dom_type', 'props', 'children', 'memo'], 
            fn: (dom_type, props, children, usememo) => usememo ? ha.memo(runh, {d: dom_type, p: props, c: children}) : runh({d: dom_type, p: props, c: children})}, 
        app: ha.app, 
        text: {args: ['text'], fn: ha.text}
    },
    scripts: { d3subscription, updateSimulationNodes, keydownSubscription, calculateLevels, listen, graph_subscription, save_graph},
    panzoom: pzobj,
    run: (graph, fn, args?, lib?, options?) => {
      try{
        const result = run({graph: typeof graph === "string" ? graph : graph.id, fn, lib: lib ? {...hlib, ...lib} : hlib}, isArgs(args) ? args : args ? new Map(Object.entries(args)) : new Map(), options)
        if(ispromise(result)){
          return result.catch(e => console.error(e));
        }

        return result;
      } catch(e) {
        console.error(e);
      }
    },
    run_runnable: (runnable, args?, options?) => run(runnable, args, options),
    initStore: (nodysseusStore) => initStore(nodysseusStore),
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    worker: undefined,
    workerPostMessage: (runnable: FunctorRunnable, args: Map<string, any>, transferrableObjects?: Array<any>) => {
      wrapPromise(hlib.worker()).then(worker => worker.postMessage({
        graph: getRunnableGraphId(runnable, hlibLib), 
        fn: runnable.fn, 
        env: {data: args}
      }, transferrableObjects));
    }
}

export const hlibLib = newLib(hlib);

