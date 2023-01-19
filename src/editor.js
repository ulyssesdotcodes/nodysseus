import { resfetch, hashcode, nolib, run, ispromise, base_graph, base_node, lokidbToStore, initStore } from "./nodysseus";
import * as ha from "hyperapp";
import panzoom from "panzoom";
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";
import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state"
import { language } from "@codemirror/language"
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { ancestor_graph, contract_node, calculateLevels, create_randid, expand_node, findViewBox, node_args, mapMaybePromise, wrapPromise } from "./util";
import loki from "lokijs";
import {openDB } from "idb"
import * as Y from "yjs"
import {IndexeddbPersistence} from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
// import { WebrtcProvider } from "./nod-y-webrtc";
import { WebrtcProvider } from "y-webrtc";
import autocomplete from "autocompleter";
import generic from "./generic"
import { isRunnable } from "./types";
import extend from "just-extend";

class NodyWS extends WebSocket {
  constructor(url) {
    super(url, 'json.webpubsub.azure.v1')
  }
  send(v){
    super.send(JSON.stringify({
      type: "sendToGroup",
      group: 'group1',
      data: v,
      dataType: 'binary'
    }))
  }
}



const updateSimulationNodes = (dispatch, data) => {
    const simulation_node_data = new Map();
    if(!data.clear_simulation_cache){
        data.simulation.nodes().forEach(n => {
            simulation_node_data.set(n.node_id, n)
        });
    }

    const start_sim_node_size = simulation_node_data.size;
    
    const simulation_link_data = new Map();
    if(!data.clear_simulation_cache){
        data.simulation.force('links').links().forEach(l => {
            simulation_link_data.set(`${l.source.node_id}__${l.target.node_id}`, l);
        })
    }

    const start_sim_link_size = simulation_link_data.size;

    const main_node_map = new Map();

    const node_map = new Map(Object.entries(data.display_graph.nodes));
    const children_map = new Map(Object.values(data.display_graph.nodes).map(n => [n.id, 
        [data.display_graph.edges[n.id]?.to].filter(e => e)
    ]));

    const order = [];
    const queue = [data.display_graph.out ?? "out"];

    const parents_map = new Map(Object.values(data.display_graph.nodes).map(n => [n.id, 
        nolib.no.runtime.get_edges_in(data.display_graph, n.id).map(e => e.from)
    ]));

    let needsupdate = false;
    while(queue.length > 0) {
        const node = queue.shift();
        order.push(node);

        needsupdate ||= !simulation_node_data.has(node)

        main_node_map.set(node, node);

        parents_map.get(node).forEach(p => {
            needsupdate ||= simulation_link_data.has(`${p}_${node}`)
            queue.push(p)
        })
    }

    const ancestor_count = new Map();
    const reverse_order = [...order];
    reverse_order.reverse();

    reverse_order.forEach(n => ancestor_count.set(n, parents_map.has(n) ? parents_map.get(n).reduce((acc, c) => acc + (ancestor_count.get(c) || 0) + 1, 0): 0));

    for(let ps of parents_map.values()) {
        let i = 0;
        ps.sort((a, b) => parents_map.get(a).length === parents_map.get(b).length 
            ? (simulation_node_data.get(main_node_map.get(a))?.hash ?? hashcode(a)) - (simulation_node_data.get(main_node_map.get(b)) ?? hashcode(b))
            : ((i++ % 2) * 2 - 1) * (parents_map.get(b).length - parents_map.get(a).length))
    }
    //// pushes all root nodes, not just display_graph.out
    // data.display_graph.nodes.forEach(n => {
    //     const children = children_map.get(n.id);
    //     const node_id = children.length > 0 ? n.id + "_" + children[0] : n.id;
    //     main_node_map.set(n.id, node_id);

        // if(children_map.get(n.id).length === 0) {
        //     queue.push(n.id);
        // }
    // });
    

    const nodes = order.flatMap(nid => {
        let n = node_map.get(nid);
        const children = children_map.get(n.id);
        const node_id = main_node_map.get(n.id);
        const stored_siblings = parents_map.get(children[0]);
        stored_siblings?.sort((a, b) => ancestor_count.get(a) - ancestor_count.get(b));

        const siblings = [];
        stored_siblings?.forEach((s, i) => {
            if(i % 2 == 0) {
                siblings.push(s);
            } else {
                siblings.unshift(s);
            }
        })

        const node_hash = simulation_node_data.get(node_id)?.hash ?? hashcode(nid);
        const randpos = {x: (((node_hash * 0.254) % 256.0) / 256.0), y: ((node_hash * 0.874) % 256.0) / 256.0};

        const sibling_idx = siblings?.findIndex(v => v === n.id);
        const sibling_mult = sibling_idx - (siblings?.length - 1) * 0.5;

        const addorundefined = (a, b) => {
            return a === undefined || b === undefined ? undefined : a + b
        }

        const calculated_nodes = children.length === 0 ? [{
            node_id: n.id,
            hash: simulation_node_data.get(node_id)?.hash ?? hashcode(n.id),
            nested_node_count: n.nodes ? Object.keys(n.nodes).length : n.nodes,
            nested_edge_count: n.edges ? Object.keys(n.edges).length : n.edges,
            x: Math.floor(simulation_node_data.get(node_id)?.x 
                ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
            y: Math.floor(simulation_node_data.get(node_id)?.y 
                ?? addorundefined(simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y, 128)
                ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
        }] : children.map((c, i) => ({
            node_id: n.id,
            hash: simulation_node_data.get(node_id)?.hash ?? hashcode(n.id),
            sibling_index_normalized: parents_map.get(c).findIndex(p => p === n.id) / parents_map.get(c).length,
            nested_node_count: n.nodes ? Object.keys(n.nodes).length : n.nodes,
            nested_edge_count: n.edges ? Object.keys(n.edges).length : n.edges,
            x: Math.floor(simulation_node_data.get(node_id)?.x 
                ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                ?? addorundefined(
                    simulation_node_data.get(children[0])?.x, 
                    sibling_mult * (256 + 32 * Math.log(Math.max(1, ancestor_count.get(n.id))/ Math.log(1.01)))
                )
                ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
            y: Math.floor(simulation_node_data.get(node_id)?.y 
                ?? addorundefined(256, simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y)
                ?? addorundefined(
                    -(16 + 32 * Math.log(Math.max(1, ancestor_count.get(n.id) * 0.5 + parents_map.get(children_map.get(n.id)?.[0])?.length)) / Math.log(1.25)),
                    simulation_node_data.get(main_node_map.get(children_map.get(n.id)?.[0]))?.y
                )
                ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
        }));

        calculated_nodes.map(n => simulation_node_data.set(n.node_id, n));

        return calculated_nodes;
    })

    const links = Object.values(data.display_graph.edges)
        .filter(e => main_node_map.has(e.from) && main_node_map.has(e.to))
        .map(e => {
            const l = simulation_link_data.get(`${e.from}__${e.to}`);
            const proximal = (
                (parents_map.get(main_node_map.get(e.to))?.length ?? 0) + 
                (parents_map.get(children_map.get(main_node_map.get(e.to)))?.length ?? 0)
            ) * 0.5;
            return {
                ...e,
                source: e.from,
                target: main_node_map.get(e.to),
                sibling_index_normalized: simulation_node_data.get(e.from).sibling_index_normalized,
                strength: 2 * (1.5 - Math.abs(simulation_node_data.get(e.from).sibling_index_normalized - 0.5)) / (1 + 2 * Math.min(4, proximal)),
                distance: 32 + 4 * (Math.min(8, proximal)) 
            };
        }).filter(l => !!l);


    if (typeof (links?.[0]?.source) === "string") {
        if (
            simulation_node_data.size !== start_sim_node_size ||
            simulation_link_data.size !== start_sim_link_size || 
            data.simulation.nodes()?.length !== nodes.length ||
            data.simulation.force('links')?.links().length !== links.length) {
            data.simulation.alpha(0.8);
        }

        data.simulation.nodes(nodes);
        data.simulation.force('links').links(links);
        // data.simulation.force('fuse_links').links(data.fuse_links);
    }

    const parentlengths = [...parents_map.values()].map(c => c.length).filter(l => l > 0);
    const maxparents = Math.max(...parentlengths);
    const avgparents = parentlengths.reduce((acc, v) => acc + v, 0) / nodes.length;
    const logmaxparents = maxparents === 1 ? nodes.length : Math.log(nodes.length) / Math.log(1 + avgparents);

    data.simulation.force('link_direction')
        .y(n =>
            (((parents_map.get(n.node_id)?.length > 0 ? 1 : 0)
                + (children_map.get(n.node_id)?.length > 0 ? -1 : 0)
                + (children_map.get(n.node_id)?.length > 0 ? -1 : 0))
                * (logmaxparents + 3) + .5) * window.innerHeight)
        .strength(n => (!!parents_map.get(n.node_id)?.length === !children_map.get(n.node_id)?.length)
            || children_map.get(n.node_id)?.length > 0 ? .01 : 0);


    data.simulation.force('collide').radius(96);
    // data.simulation.force('center').strength(n => (levels.parents_map.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children_map.get(n.node_id)?.length ?? 0) * 0.25)
}


// Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
// This is probably doing too much.
const d3subscription = (dispatch, props) => {
    const simulation = hlib.d3.forceSimulation()
        .force('charge', hlib.d3.forceManyBody().strength(-1024).distanceMax(1024).distanceMin(64))
        .force('collide', hlib.d3.forceCollide(64))
        .force('links', hlib.d3
            .forceLink([])
            .distance(l => l.distance ?? 128)
            .strength(l => l.strength)
            .id(n => n.node_id))
        .force('link_direction', hlib.d3.forceY().strength(.01))
        // .force('center', hlib.d3.forceCenter().strength(0.01))
        // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_id))
        // .force('link_siblings', lib.d3.forceX().strength(1))
        // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
        .velocityDecay(0.7)
        .alphaMin(.25);

    const abort_signal = { stop: false };
    simulation.stop();
    let htmlid;
    let stopped = false;
    let selected;
    const node_el_width = 256;
    const tick = () => {
        if(simulation.nodes().length === 0) {
            requestAnimationFrame(() => dispatch(s => [(htmlid = s.html_id, {...s, simulation}), [props.update, s]]));
        }

        if (simulation.alpha() > simulation.alphaMin()) {
            const data = {
                nodes: simulation.nodes().map(n => {
                    return ({ ...n, x: ( Math.floor(n.x)), y: Math.floor(n.y) })
                }),
                links: simulation.force('links').links().map(l => ({
                    ...l,
                    as: l.as,
                    type: l.type,
                    source: ({
                        node_id: l.source.node_id,
                        x: Math.floor(l.source.x),
                        y: Math.floor(l.source.y)
                    }),
                    target: ({
                        node_id: l.target.node_id,
                        x: Math.floor(l.target.x),
                        y: Math.floor(l.target.y)
                    })
                }))};
            const ids = simulation.nodes().map(n => n.node_id).join(',');
            stopped = false;
            simulation.tick();
            dispatch([s => (selected = s.selected[0],
                s.nodes.map(n => n.node_id).join(',') !== ids ? [props.action, data] 
                    : [{...s, stopped}, 
                        !s.noautozoom && [
                            hlib.panzoom.effect, {
                                ...s, 
                                nodes: simulation.nodes().map(n => ({...n, x: n.x - 8, y: n.y})), 
                                links: simulation.force('links').links(), 
                                prevent_dispatch: true, 
                                node_id: s.selected[0]
                            }
                        ]
                    ])]);

            const visible_nodes = [];
            const visible_node_set = new Set();
            let selected_pos;

            simulation.nodes().map(n => {
                const el = document.getElementById(`${htmlid}-${n.node_id.replaceAll("/", "_")}`);
                if(el) {
                    const x = n.x - node_el_width * 0.5;
                    const y = n.y ;
                    el.setAttribute('x', Math.floor(x - 20));
                    el.setAttribute('y', Math.floor(y - 20));

                    if(n.node_id === selected) {
                        visible_nodes.push({x, y})
                        selected_pos = {x, y};
                    }
                }
            });


            simulation.force('links').links().map(l => {
                const el = document.getElementById(`link-${l.source.node_id}`);
                const edge_label_el = document.getElementById(`edge-info-${l.source.node_id}`);
                const insert_el = document.getElementById(`insert-${l.source.node_id}`);
                if(el && edge_label_el) {
                    const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
                    const target = {x: l.target.x - node_el_width * 0.5, y: l.target.y};
                    const length_x = Math.abs(source.x - target.x); 
                    const length_y = Math.abs(source.y - target.y); 
                    const length = Math.sqrt(length_x * length_x + length_y * length_y); 
                    const lerp_length = 24;
                    // return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
                    el.setAttribute('x1', Math.floor(Math.floor(source.x + (target.x - source.x) * lerp_length / length)));
                    el.setAttribute('y1', Math.floor(Math.floor(source.y + (target.y - source.y) * lerp_length / length)));
                    el.setAttribute('x2', Math.floor(Math.floor(source.x + (target.x - source.x) * (1 - lerp_length / length))));
                    el.setAttribute('y2', Math.floor(Math.floor(source.y + (target.y - source.y) * (1 - lerp_length / length))));

                    const min_edge_label_dist = 32 / Math.abs(target.y - source.y);
                    const max_edge_label_dist = Math.min(64 / Math.abs(target.y - source.y), 0.5);
                    const edge_label_dist = Math.min(max_edge_label_dist, Math.max(min_edge_label_dist, 0.125));

                    edge_label_el.setAttribute('x', (target.x - source.x) * edge_label_dist + source.x + 16)
                    edge_label_el.setAttribute('y', (target.y - source.y) * edge_label_dist + source.y);

                    if(insert_el) {
                        insert_el.setAttribute('x', Math.floor((source.x + target.x) * 0.5 - 16))
                        insert_el.setAttribute('y', Math.floor((source.y + target.y) * 0.5 - 16))
                    }

                    if (l.source.node_id === selected) {
                        visible_nodes.push({x: target.x, y: target.y});
                        visible_node_set.add(l.target.node_id);
                    } else if (l.target.node_id === selected) {
                        visible_nodes.push({x: source.x, y: source.y});
                        visible_node_set.add(l.source.node_id);
                    }
                }
            })

            // iterate again to get grandparents
            simulation.force('links').links().map(l => {
                if(visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
                    const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
                    visible_nodes.push({x: source.x, y: source.y});
                }
            })
        } else if(!stopped) {
            const data = {
                nodes: simulation.nodes().map(n => {
                    return ({ ...n, x: ( Math.floor(n.x)), y: Math.floor(n.y) })
                }),
                links: simulation.force('links').links().map(l => ({
                    ...l,
                    as: l.as,
                    type: l.type,
                    source: ({
                        node_id: l.source.node_id,
                        x: Math.floor(l.source.x),
                        y: Math.floor(l.source.y)
                    }),
                    target: ({
                        node_id: l.target.node_id,
                        x: Math.floor(l.target.x),
                        y: Math.floor(l.target.y)
                    })
                }))};
            stopped = true; 
            requestAnimationFrame(() => {
                dispatch([props.action, data])
                dispatch(s => [{...s, noautozoom: false, stopped}, !s.noautozoom && [hlib.panzoom.effect, {...s, node_id: s.selected[0]}]])
            });
        }

        if (!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);

    return () => { abort_signal.stop = true; }
}

const keydownSubscription = (dispatch, options) => {
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

const graph_subscription = (dispatch, props) => {
    let animframe = false;
    const listener = (graph) => {
        if(props.display_graph_id === graph.id) {
          if(animframe){
            cancelAnimationFrame(animframe)
          }
          animframe = requestAnimationFrame(() =>  {
              animframe = false;
              dispatch(s => [{...s, display_graph: graph}, [UpdateSimulation]])
          })
        }
    };

    nolib.no.runtime.add_listener('graphchange', 'update_hyperapp', listener);
    return () => nolib.no.runtime.remove_listener('graphchange', 'update_hyperapp');
}

const select_node_subscription = (dispatch, props) => {
    const listener = (data) => {
        dispatch(SelectNode, { node_id: data.data.substring(data.data.indexOf("/") + 1) })
    }

    nolib.no.runtime.add_listener("selectnode", 'hyperapp', listener);
    return () => nolib.no.runtime.remove_listener('selectnode', 'hyperapp');
}

const listen = (type, action) => [listenToEvent, {type, action}]

const listenToEvent = (dispatch, props) => {
    const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event.detail))

    requestAnimationFrame(() => addEventListener(props.type, listener));
    return () => removeEventListener(props.type, listener);
}

const ap = (fn, v) => fn(v);
const ap_promise = (p, fn, cfn) => p && typeof p['then'] === 'function' ? cfn ? p.then(fn).catch(cfn) : p.then(fn) : ap(fn, p);

const refresh_graph = (graph, dispatch, norun = false) => {
    if(norun) {
      return
    }
    dispatch(s => s.error ? Object.assign({}, s, {error: false}) : s)
    const result = hlib.run(graph, graph.out ?? "out", {_output: "value"});
    const reslib = hlib.run(graph, graph.out ?? "out", {_output: "lib"})
    // const result = hlib.run(graph, graph.out, {});
    const display_fn = result => hlib.run(graph, graph.out ?? "out", {_output: "display"});
    // const display_fn = result => hlib.run(graph, graph.out, {}, "display");
    const update_result_display_fn = display => result_display_dispatch(UpdateResultDisplay, {el: display && display.dom_type ? display : {dom_type: 'div', props: {}, children: []}})
    const update_info_display_fn = () => dispatch(s => [s, s.selected[0] !== s.display_graph.out 
        && !s.show_all && [() => update_info_display({fn: s.selected[0], graph: s.display_graph, args: {}, lib: {...hlib, ...nolib, ...reslib}})]])
    ap_promise(ap_promise(result, display_fn), update_result_display_fn);
    ap_promise(result, update_info_display_fn)
    return result
}

const result_subscription = (dispatch, {display_graph_id, norun}) => {
    let animrun = false;

    const error_listener = (error) =>
        requestAnimationFrame(() => {
            dispatch(s => Object.assign({}, s, {error: s.error ? s.error.concat([error]) : [error]}))
        });

    nolib.no.runtime.add_listener('grapherror', 'update_hyperapp_error', error_listener);

    const change_listener = graph => {
        if((graph.id === display_graph_id || graph.graphid === display_graph_id) && !animrun) {
            cancelAnimationFrame(animrun)
            animrun = requestAnimationFrame(() => {
                const result = refresh_graph(nolib.no.runtime.get_ref(display_graph_id), dispatch, norun)
                const reset_animrun = () => animrun = false;
                ap_promise(result, reset_animrun, reset_animrun)
            })
        }
    }

    nolib.no.runtime.add_listener('graphupdate', 'clear_hyperapp_error', change_listener);
    const timeouts = {}
    const animframes = {}

    const noderun_listener = (data) => {
        if (data.graph.id === display_graph_id && !timeouts[data.node_id]) {
            const el = document.querySelector(`#node-editor-${data.node_id.replaceAll("/", "_")} .shape`)
            if(el) {
                timeouts[data.node_id] && clearTimeout(timeouts[data.node_id])
                animframes[data.node_id] && cancelAnimationFrame(animframes[data.node_id])
                el.classList.remove("flash-transition-out");
                el.classList.add("flash-transition")
                animframes[data.node_id] = requestAnimationFrame(() => {
                    animframes[data.node_id] = false;
                    if(timeouts[data.node_id]) {
                        el.classList.add("flash-transition-out")
                        el.classList.remove("flash-transition")
                    }
                })
                timeouts[data.node_id] = setTimeout(() => {
                    timeouts[data.node_id] = false
                    el.classList.remove("flash-transition-out");
                }, 1000)
            }
        }
    }

    nolib.no.runtime.add_listener('noderun', 'update_hyperapp_error', noderun_listener);

    return () => (
        nolib.no.runtime.remove_listener('graphupdate', 'clear_hyperapp_error', change_listener),
        nolib.no.runtime.remove_listener('grapherror', 'update_hyperapp_error', error_listener)
    );
}

const pzobj = {
    animationframe: false,
    effect: function(dispatch, payload){
        if(!hlib.panzoom.instance || !payload.node_id){ return; }
        pzobj.lastpanzoom = performance.now();
        const viewbox = findViewBox(
            payload.nodes, 
            payload.links, 
            payload.node_id,
            payload.node_el_width, 
            payload.html_id,
            payload.dimensions
        );
        const x = payload.dimensions.x * 0.5 - viewbox.center.x;
        const y = payload.dimensions.y * 0.5 - viewbox.center.y
        const scale = hlib.panzoom.instance.getTransform().scale;
        hlib.panzoom.instance.moveTo(x, y);
        hlib.panzoom.instance.zoomTo(x, y, 1 / scale)

        if(!payload.prevent_dispatch) {
            if(pzobj.animationframe) {
              cancelAnimationFrame(pzobj.animationframe)
            }
            pzobj.animationframe = requestAnimationFrame(() => {
              pzobj.animationframe = false;
              dispatch((s, p) => [ 
                  { ...s, show_all: false, },
                  [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: false}))]
              ])
            });
        }
    },
    getTransform: function() {
        return hlib.panzoom.instance.getTransform()
    },
    init: function (dispatch, sub_payload) {
        hlib.panzoom.lastpanzoom = 0;
        let init = requestAnimationFrame(() => {
            hlib.panzoom.instance = panzoom(document.getElementById(sub_payload.id), {
                filterKey: e => true,
                smoothScroll: false,
                onTouch: (e) => {
                    if(e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: hlib.panzoom.instance.getTransform(), noautozoom: true}) 
                    }
                    return true;
                },
                beforeWheel: (e) => {
                    if(e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: hlib.panzoom.instance.getTransform(), noautozoom: true}) 
                    }
                    return false;
                },
                beforeMouseDown: (e) => {
                    const should_zoom  = e.buttons == 4 || e.altKey;
                    if(!should_zoom && e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: hlib.panzoom.instance.getTransform(), noautozoom: true}) 
                    }
                    return should_zoom;
                }
            });
            let currentEvent = false;
            document.getElementById(sub_payload.id).ownerSVGElement.addEventListener("pointermove", e => {
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
                    hlib.panzoom.instance.zoomTo(currentEvent.offset.x, currentEvent.offset.y, scaleMultiplier);
                } else {
                    currentEvent = false;
                }
            })
            document.getElementById(sub_payload.id).ownerSVGElement.addEventListener("pointerup", e => {
                currentEvent = false
            })
            hlib.panzoom.instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
        });
        return () => { cancelAnimationFrame(init); hlib.panzoom.instance?.dispose(); }
    }
}

const run_h = ({dom_type, props, children, text}, exclude_tags=[]) => {
    dom_type = dom_type && dom_type._Proxy ? dom_type._value : dom_type;
    text = text?.value ?? text;
    // props = props && props.value ? props.value : props;
    // props = props ? Object.fromEntries(Object.entries(props).map(kv => [kv[0], kv[1]?.value ?? kv[1]])) : props
    children = children && children._Proxy ? children.value : children;
    return dom_type === "text_value" 
        ? ha.text(text) 
        : ha.h(dom_type, props, children?.map(c => c.el ?? c).filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}

const UpdateSimulation = (dispatch, payload) => payload ? !(payload.simulation || payload.static) ? undefined : updateSimulationNodes(dispatch, payload) : dispatch(state => [state, [() => !(state.simulation || state.static) ? undefined : updateSimulationNodes(dispatch, state)]])

const UpdateGraphDisplay = (dispatch, payload) => requestAnimationFrame(() => dispatch(s => [{
    ...s,
    levels: calculateLevels(payload.nodes, payload.links, payload.display_graph, payload.selected)
}]))

const CustomDOMEvent = (_, payload) => document.getElementById(`${payload.html_id}`)?.dispatchEvent(new CustomEvent(payload.event, {detail: payload.detail}))

const SimulationToHyperapp = (state, payload) => [{
    ...state,
    levels: calculateLevels(payload.nodes, payload.links, state.display_graph, state.selected),
    nodes: payload.nodes,
    links: payload.links,
    randid: create_randid(),
}, 
    [CustomDOMEvent, {html_id: state.html_id, event: 'updategraph', detail: {graph: state.display_graph}}]
];

const FocusEffect = (_, {selector}) => setTimeout(() => {
    const el = document.querySelector(selector);
    if(!el) return

    el.focus();
    if(el instanceof HTMLInputElement && el.type === "text") {
        el.select()
    }
}, 100);

const SetSelectedPositionStyleEffect = (_, {node, svg_offset, dimensions}) => {
    const rt = document.querySelector(':root');
    rt.style.setProperty('--nodex',  `${Math.min(node.x * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0) - 64, dimensions.x - 256)}px`);
    rt.style.setProperty('--nodey',  `${node.y * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0) + 32}px`);
}

const SelectNode = (state, {node_id, focus_property}) => [
    state.selected[0] === node_id ? state : {
      ...state, 
      selected: [node_id], 
      inputs: {},
      selected_edges_in: nolib.no.runtime.get_edges_in(state.display_graph, node_id)
    },
    !state.show_all && [pzobj.effect, {...state, node_id: node_id}],
    [UpdateGraphDisplay, {...state, selected: [node_id]}],
    (state.show_all || state.selected[0] !== node_id) && [pzobj.effect, {...state, node_id}],
    focus_property && [FocusEffect, {selector: `.node-info input.${focus_property}`}],
    state.nodes.find(n => n.node_id === node_id) && [SetSelectedPositionStyleEffect, {node: state.nodes.find(n => n.node_id === node_id), svg_offset: pzobj.getTransform(), dimensions: state.dimensions}],
    node_id === state.display_graph.out 
        ? [() => info_display_dispatch({el: {dom_type: "div", props: {}, children: [
            {dom_type: "text_value", text: "Most recent graphs"},
            { dom_type: "ul", props: {}, children: localStorage.getItem("graph_list") 
                ? JSON.parse(localStorage.getItem("graph_list")).slice(0, 10).map(gid => ({dom_type: "li", props: {}, children: [
                    {
                        dom_type: "a", 
                        props: { href: "#", onclick: s => [s, [() => main_app_dispatch(ms => [ms, [ChangeDisplayGraphId, {id: gid, display_graph_id: state.display_graph_id}]])]]}, 
                        children: [{dom_type: "text_value", text: gid}]}
                ]}))
                : []
            }
        ]}})]
        : [() => update_info_display({
          fn: node_id, 
          graph: state.display_graph, 
          args: {}, 
          lib: {...hlib, ...nolib, ...hlib.run(state.display_graph, state.display_graph.out ?? "out", {_output: "lib"})}
        })],
    state.selected[0] !== node_id && [() => nolib.no.runtime.publish("nodeselect", {data: node_id})]
]

const CreateNode = (state, {node, child, child_as, parent}) => [
    {
        ...state, 
        history: state.history.concat([{action: 'add_node', node, child, child_as}])
    },
    [dispatch => {
        nolib.no.runtime.add_node(state.display_graph, node, hlib)
        nolib.no.runtime.update_edges(state.display_graph, 
            parent 
                ? [{from: node.id, to: child, as: parent.as}, {from: parent.from, to: node.id, as: 'arg0'}] 
                : [{from: node.id, to: child, as: child_as}], 
            parent ? [{from: parent.from, to: child}] : []
        , hlib)
        // Hacky - have to wait until the node is finished adding and the graph callback takes place before updating selected node.
        setTimeout(() => requestAnimationFrame(() => dispatch(SelectNode, {node_id: node.id})), 50);
    }]
];

const DeleteNode = (state, {node_id}) => [
    {
        ...state, 
        history: state.history.concat([{action: 'delete_node', node_id}]) 
    },
    [(dispatch, {node_id}) => requestAnimationFrame(() => dispatch(SelectNode, {node_id})), {node_id: nolib.no.runtime.get_edge_out(state.display_graph, node_id).to}],
    [() => nolib.no.runtime.delete_node(state.display_graph, node_id, hlib)]
]

const ExpandContract = (state, {node_id}) => {
    const node = state.display_graph.nodes[node_id]
    const update = node.nodes 
            ? expand_node({nolib, node_id, display_graph: state.display_graph})
            : contract_node({nolib, node_id, display_graph: state.display_graph});
    
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

const CreateRef = (state, {node}) => [
    state,
    [dispatch => {
        const graph = {...base_graph(node), id: node.name, value: undefined};
        nolib.no.runtime.change_graph(base_graph(graph), hlib);
        save_graph(graph);
        nolib.no.runtime.add_node(state.display_graph, {
            id: node.id,
            value: node.value,
            ref: node.name,
            name: undefined,
        }, hlib);
    }]
]

const Copy = (state, {cut, as}) => {
    return {...state, copied: {graph: ancestor_graph(state.selected[0], state.display_graph, nolib), root: state.selected[0], as}};
}

const Paste = state => [
    {...state},
    [dispatch => {
        const node_id_map = {};
        Object.values(state.copied.graph.nodes).forEach(n => {
            const new_id = create_randid();
            node_id_map[n.id] = new_id;
            nolib.no.runtime.add_node(state.display_graph, {...n, id: new_id}, hlib)
        });
        nolib.no.runtime.update_edges(
            state.display_graph, 
            Object.values(state.copied.graph.edges)
                .map(e => ({...e, from: node_id_map[e.from], to: node_id_map[e.to]}))
                .concat([{from: node_id_map[state.copied.root], to: state.selected[0], as: state.copied.as}]),
          [],
          hlib
            );
        requestAnimationFrame(() => dispatch(SelectNode, {node_id: node_id_map[state.copied.root], focus_property: 'edge'}))
    }]
]

const StopPropagation = (state, payload) => [state, [() => payload.stopPropagation()]];

const update_graph_list = graph_id => {
  const graph_list = JSON.parse(localStorage.getItem('graph_list'))?.filter(l => l !== graph_id) ?? []; 
  graph_list.unshift(graph_id); 
  localStorage.setItem('graph_list', JSON.stringify(graph_list)); 

}

const save_graph = graph => {
  graph = base_graph(graph);
  const graphstr = JSON.stringify(base_graph(graph)); 
  // localStorage.setItem(graph.id, graphstr); 
  nolib.no.runtime.add_ref(graph);
}

const SaveGraph = (dispatch, payload) => save_graph(payload.display_graph)

const ChangeDisplayGraphId = (dispatch, {id, select_out, display_graph_id}) => {
    requestAnimationFrame(() => {
        const graphPromise = wrapPromise(nolib.no.runtime.get_ref(id, display_graph_id && nolib.no.runtime.get_ref(display_graph_id)))
            // ?? Promise.any([
            //   navigator.onLine ? resfetch(`json/${id}.json`)
            //     .then(r => r.status === 200 ? r.json() : Promise.reject())
            //     .then(gs => {
            //       nolib.no.runtime.add_refs(Array.isArray(gs) ? gs : [gs]);
            //       return nolib.no.runtime.get_ref(id);
            //     }) : Promise.reject()]))
            //   new Promise((res, rej) => setTimeout(() => res(), 1000))
            //     .then(() => nolib.no.runtime.get_ref(display_graph_id ?? "simple"))
            //     .then(graph => ({...graph, id, name: id}))
            //     .then(g => ({...g, nodes: Object.fromEntries(Object.values(g.nodes).map(n => [n.id, n.id === (g.out ?? "out") ? {...n, name: id} : n]))}))
            // ])).then(g => Array.isArray(g.nodes) && Array.isArray(g.edges) ? {...g, nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: Object.fromEntries(g.edges.map(e => [e.from, e]))} : g )


        window.location.hash = '#' + id; 
        graphPromise.then(graph => dispatch(state => [
            {...state, display_graph_id: id},
            [dispatch => {
                requestAnimationFrame(() => {
                    update_graph_list(id)
                    const new_graph = graph ?? Object.assign({}, base_graph(state.display_graph), {id});
                    nolib.no.runtime.change_graph(new_graph, hlib);
                    nolib.no.runtime.remove_graph_listeners(state.display_graph_id);
                    dispatch(s => {
                        const news = {...s, display_graph: new_graph, selected: [new_graph.out], display_graph_id: new_graph.id}
                        return [news, [UpdateSimulation, {...news, clear_simulation_cache: true}]]
                    })
                    if(!graph) {
                        dispatch(UpdateNode, {
                            node: nolib.no.runtime.get_node(new_graph, new_graph.out), 
                            property: "name", 
                            value: id,
                            display_graph: new_graph
                        })
                    }
                    select_out && dispatch(SelectNode, {node_id: new_graph.out ?? "out"})
                })
            }],
        ]))
    })
}

const Search = (state, {payload, nodes}) => {
    if(payload.key === "Escape") {
        return [{...state, search: false, search_index: 0}, [dispatch => payload.target.value = ""]]
    }

    const direction = payload.key === "Enter" ? payload.shiftKey ? -1 : 1 : 0; 
    const search_results = new Fuse(
        nodes.map(n => Object.assign({}, n, 
            nolib.no.runtime.get_node(state.display_graph, n.node_id), 
            nolib.no.runtime.get_edge_out(state.display_graph, n.node_id))), 
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

const UpdateNodeEffect = (_, {display_graph, node}) => {
  nolib.no.runtime.add_node( display_graph, node, hlib)
  const edges_in = nolib.no.runtime.get_edges_in(display_graph, node.id);
  const nodeargs = node_args(nolib, display_graph, node.id);
  if(edges_in.length === 1 && nodeargs.length === 2) {
    nolib.no.runtime.update_edges(display_graph, [{...edges_in[0], as: nodeargs[0].name}], [], hlib)
  }
}

const UpdateNode = (state, {node, property, value, display_graph}) => [
    {
        ...state, 
        history: state.history.concat([{action: 'update_node', node: node ?? nolib.no.runtime.get_node(state.display_graph, state.selected[0]), property, value }]) 
    },
    [UpdateNodeEffect, {
        display_graph: display_graph ?? state.display_graph,
        node: Object.fromEntries(Object.entries(Object.assign({}, 
            base_node(node ?? nolib.no.runtime.get_node(state.display_graph, state.selected[0])), 
            {[property]: value === "" ? undefined : value})).filter(kv => kv[1] !== undefined))
    }]
]

const UpdateEdge = (state, {edge, as}) => [
    state,
    [() => nolib.no.runtime.update_edges(state.display_graph, {...edge, as}, edge, hlib)]
]

const OpenMenu = state => [{...state, menu: true}]

const Undo = state => [
    { ...state, history: state.history.slice(0, -1) },
    state.history[0]?.action === "update_node"
    ? [UpdateNodeEffect, {display_graph: state.history[0].display_graph, node: state.history[0].node}]
    : []
]

const fill_rect_el = () =>ha.h('rect', {class: 'fill', width: '48', 'height': '48'}, [])
const node_text_el = ({node_id, primary, focus_primary, secondary}) =>ha.h('text', {x: 48, y: 12}, [
   ha.h('tspan', {class: "primary", dy: ".6em", x: "48", onclick: [SelectNode, {node_id, focus_property: focus_primary}]}, ha.text(primary)),
   ha.h('tspan', {class: "secondary", dy: "1.2em", x: "48", onclick: [SelectNode, {node_id, focus_property: "ref"}]}, ha.text(secondary))
])

const defs = () =>ha.h('defs', {}, [
   ha.h('filter', {id: "flood-background", width: 1.2, height: 1.1, x: 0, y: 0}, [
       ha.h('feFlood', {floodColor: "#000a"}),
       ha.h('feComposite', {in: "SourceGraphic", operator: "over"})
    ]),
   ha.h('marker', {id: "arrow", refX: 8, refY: 4, markerWidth: 8, markerHeight: 8, markerUnits: "userSpaceOnUse", orient: "auto"}, [
       ha.h('polyline', {points: "1 1, 8 4, 1 8"})
    ])
])

const radius = 24;
const node_el = ({html_id, selected, error, selected_distance, node_id, node_ref, node_name, node_value, has_nodes, nested_edge_count, nested_node_count}) =>ha.h('svg', {
    onclick: [SelectNode, {node_id}],  
    ontouchstart: [SelectNode, {node_id}], 
    width: '256', 
    height: '64', 
    key: html_id + '-' + node_id, 
    id: html_id + '-' + node_id.replaceAll("/", "_"), 
    class: {
        node: true, 
        selected, 
        [`distance-${selected_distance < 4 ? selected_distance : 'far'}`]: true
    }
}, [
   ha.h(
        (node_value !== undefined && !(node_ref && node_ref !== "arg")) 
          || (node_value === undefined && node_ref === undefined) ? 'polygon' 
        : node_ref === 'return' ? 'rect'
        : 'circle', 
        node_value !== undefined && !(node_ref && node_ref !== "arg") 
          || (node_value === undefined && node_ref === undefined)
            ? {class: {shape: true, value: true, error}, points: `4,${4 + radius} ${4 + radius},${4 + radius} ${4 + radius * 0.5},4`} 
            : node_ref === 'return'
            ? {class:{shape: true, ref: true, error}, width: radius, height: radius, x: 10, y: 10}
            : {class: {shape: true, none: true, error}, r: radius * 0.5 , cx: radius * 0.5 + 8, cy: radius * 0.5 + 8}
    ),
    ha.memo(node_text_el, {
        node_id: node_id,
        primary: node_name ? node_name : node_value ? node_value : '', 
        focus_primary: node_name ? "name" : "value",
        secondary: node_ref ? node_ref : has_nodes ? `graph (${nested_node_count}, ${nested_edge_count})` : node_value !== undefined ? 'value' : 0 > 0 ? 'object' : 'undefined'
    }),
    ha.memo(fill_rect_el)
])

const link_el = ({link, selected_distance}) =>ha.h('g', {}, [
   ha.h('line', {id: `link-${link.source.node_id}`, class: {"link": true, [`distance-${selected_distance}`]: true}, "marker-end": "url(#arrow)"}),
   ha.h('svg', {
       id: `edge-info-${link.source.node_id}`, 
       class: {"edge-info": true, [`distance-${selected_distance}`]: true},
       onclick: [SelectNode, {node_id: link.source.node_id, focus_property: "edge"}],
       ontouchstart: [SelectNode, {node_id: link.source.node_id, focus_property: "edge"}]
    }, [
       ha.h('rect', {}),
       ha.h('text', {fontSize: 14, y: 16}, [ha.text(link.as)])
    ])
])


const insert_node_el = ({link, randid, node_el_width}) => ha.h('svg', {
    viewBox: "0 0 512 512",
    id: `insert-${link.source.node_id}`,
    key: `insert-${link.source.node_id}`,
    height: "32px",
    width: "32px",
    x: Math.floor((link.source.x + link.target.x - node_el_width) * 0.5) - 16,
    y: Math.floor((link.source.y + link.target.y) * 0.5) - 16,
    class: 'insert-node',
    onclick: (s, p) => [CreateNode, {node: {id: randid}, child: link.target.node_id, parent: {from: link.source.node_id, to: link.target.node_id, as: link.as}}],
    ontouchstart: (s, p) => [CreateNode, {node: {id: randid}, child: link.target.node_id, parent: {from: link.source.node_id, to: link.target.node_id, as: link.as}}]
}, [
    ha.h('path', {d: "M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z", class: "circle" }, []),
    ha.h('path', {d: "M256 176v160M336 256H176", class: "add"}, [])
])

const input_el = ({label, property, value, onchange, options, inputs, disabled}) => ha.h(
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
            oninput: oninput && ((s, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: e.target.value})}]), 
            onchange: onchange && ((s, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: undefined})}, [dispatch => dispatch(onchange, e)]]),
            onfocus: (state, event) => [{...state, focused: event.target.id}],
            onblur: (state, event) => [{...state, focused: false}],
            value: inputs[`edit-text-${property}`] ?? value
        }),
        options && options.length > 0 && ha.h('datalist', {id: `edit-text-list-${property}`}, options.map(o => ha.h('option', {value: o}))) 
    ]
)

const info_el = ({node, hidden, edges_in, link_out, display_graph_id, randid, ref_graphs, html_id, copied_graph, inputs, graph_out, editing})=> {
    //const s.display_graph.id === s.display_graph_id && nolib.no.runtime.get_node(s.display_graph, s.selected[0]) && 
    const node_ref = node && node.ref ? nolib.no.runtime.get_ref(node.ref) : node;
    const description =  node_ref?.description;
    const node_arg_labels = node?.id ? node_args(nolib, display_graph_id, node.id) : [];
    return ha.h('div', {id: "node-info-wrapper"}, [ha.h('div', {class: "spacer before"}, []), ha.h(
        'div',
        { 
            class: {'node-info': true, hidden, editing, [node.ref]: !!node.ref}, 
            onfocusin: state => [{...state, editing: true}], 
            onblurout: state => [{...state, editing: false}] 
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
                input_el({
                    label: "value", 
                    value: node.value, 
                    property: "value", 
                    inputs,
                    onchange: (state, payload) => [UpdateNode, {node, property: "value", value: payload.target.value}]}),
                input_el({
                    label: "name", 
                    value: node.name, 
                    property: "name", 
                    inputs,
                    onchange: (state, payload) => [
                        state,
                        (node.id !== graph_out && node.id !== "out") && [d => d(UpdateNode, {node, property: "name", value: payload.target.value})],
                        (node.id === graph_out || node.id === "out") && [ChangeDisplayGraphId, {id: payload.target.value, select_out: true, display_graph_id}]
                    ],
                    options: (node.id === graph_out || node.id === "out") && ref_graphs
                }),
                input_el({
                    label: 'ref',
                    value: node.ref,
                    property: 'ref',
                    inputs,
                    // onchange: (state, event) => [UpdateNode, {node, property: "ref", value: event.target.value}],
                    disabled: node.id === graph_out
                }),
                link_out && link_out.source && input_el({
                    label: "edge", 
                    value: link_out.as, 
                    property: "edge",
                    inputs,
                    options: node_args(nolib, display_graph_id, link_out.to).map(na => na.name),
                    onchange: (state, payload) => [UpdateEdge, {edge: {from: link_out.from, to: link_out.to, as: link_out.as}, as: payload.target.value}]
                }),
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
                node.nodes?.length > 0 && node.name !== '' && ha.h('div', {class: 'action', onclick: [CreateRef, {node}]}, ha.text("make ref")),
                ha.h('div', {
                    class: "action", 
                    onclick: [Copy, {cut: false, as: link_out.as}],
                    key: "copy-action"
                }, [ha.h('ion-icon', {name: 'copy-outline'}), ha.text("copy")]),
                copied_graph && ha.h('div', {
                    class: "action", 
                    onclick: [Paste],
                    key: "paste-action"
                }, [ha.h('ion-icon', {name: 'paste-outline'}), ha.text("paste")]),
                node.node_id == graph_out && ha.h('div', {
                    class: "action", 
                    onclick: (state, payload) => [state, [SaveGraph, state]]
                }, [ha.h('ion-icon', {name: 'save-outline'}), ha.text("save")]),
                node.node_id !== graph_out && ha.h('div', {
                    class: "action", 
                    onclick: [DeleteNode, {
                        parent: link_out && link_out.source ? {from: link_out.source.node_id, to: link_out.target.node_id, as: link_out.as} : undefined, 
                        node_id: node.node_id
                    }]
                }, [ha.h('ion-icon', {name: 'trash-outline'}), ha.text("delete")]),
            ]),
        ]
    ), ha.h('div', {class: "spacer after"}, [])])
}

const search_el = ({search}) => ha.h('div', {id: "search"}, [
    typeof search === "string" && ha.h('input', {type: "text", onkeydown: (state, payload) => [Search,  {payload, nodes: state.nodes}], onblur: (state, payload) => [{...state, search: false}]}, []),
    typeof search !== "string" && ha.h('ion-icon', {name: 'search', onclick: s => [{...s, search: ""}, [FocusEffect, {selector: "#search input"}]]}, [ha.text('search')]),
])


const UpdateResultDisplay = (state, el) => ({
    ...state,
    el: el.el ? {...el.el} : {...el}
})

const update_info_display = ({fn, graph, args, lib}) => {
    const node = nolib.no.runtime.get_node(graph, fn);

    const node_ref = node && (node.ref && nolib.no.runtime.get_ref(node.ref)) || node;
    const out_ref = node && (node.nodes && nolib.no.runtime.get_node(node, node.out)) || (node_ref.nodes && nolib.no.runtime.get_node(node_ref, node_ref.out));
    const node_display_el = (node.ref === "return" || (out_ref && out_ref.ref === "return")) 
        && hlib.run(graph, fn, {...args, _output: "display"}, lib);
    const update_info_display_fn = display => info_display_dispatch && requestAnimationFrame(() => {
      info_display_dispatch(UpdateResultDisplay, {el: display?.dom_type ? display : ha.h('div', {})})
      requestAnimationFrame(() => {
        if(window.getComputedStyle(document.getElementById("node-editor-code-editor")).getPropertyValue("display") !== "none") {
          code_editor.dispatch({changes:{from: 0, to: code_editor.state.doc.length, insert: node.script ?? node.value}})
        }
      });

    })
  ap_promise(node_display_el, update_info_display_fn)
}

const show_error = (e, t) => ({
    dom_type: 'div', 
    props: {}, 
    children: [
        {dom_type: 'text_value', text: `Error: ${e}`}, 
        {dom_type: 'pre', props: {}, children: [{dom_type: 'text_value', text: t}]}
    ]})

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

const info_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-info-display"),
    dispatch: middleware,
    view: s => {
        return run_h(s.el, ['script'])
    }
});

const custom_editor_display = html_id => ha.app({
    init: {el: {dom_type: 'div', props: {}, children: []}},
    node: document.getElementById(html_id + "-custom-editor-display"),
    dispatch: middleware,
    view: s => {
        return run_h(s.el, ['script'])
    }
});

const refresh_custom_editor = () => {
    if(nolib.no.runtime.get_ref("custom_editor")) {
        // TODO: combine with update_info
        // const graph = nolib.no.runtime.get_ref("custom_editor");
        // const result = hlib.run({graph, fn: graph.out}, {_output: "display"});
        // custom_editor_display_dispatch(() => ({el: result}))
    } else {
        custom_editor_display_dispatch(() => ({el: {dom_type: "div", props: {}, children: []}}))
    }
    custom_editor_display_dispatch(() => ({el: {dom_type: "div", props: {}, children: []}}))
}

let result_display_dispatch;
let info_display_dispatch;
let custom_editor_display_dispatch;
let code_editor;

const init_code_editor = (dispatch, {html_id}) => {
    requestAnimationFrame(() => {
        const languageConf = new Compartment()
        const autoLanguage = EditorState.transactionExtender.of(tr => {
          if(!tr.docChanged) return null;
          let docLang = document.getElementsByClassName("markdown").length > 0 ? 'markdown' : 'javascript';
          let stateLang = tr.startState.facet(language) == markdownLanguage ? 'markdown' : 'javascript';
          if(docLang === stateLang) return null;
          return {
            effects: languageConf.reconfigure(docLang === 'markdown' ? markdown() : javascript())
          }
        })
        const background = "#111";
        const highlightBackground = "#00000033";
        code_editor = new EditorView({extensions: [
            basicSetup, 
            EditorView.theme({
                "&": {
                    "backgroundColor": background,
                },
                ".cm-content": {
                    caretColor: "#66ccff",
                    whiteSpace: "pre-wrap",
                    width: "325px"
                },
                ".cm-gutters": {
                    backgroundColor: background,
                    outline: "1px solid #515a6b",
                },
                "&.cm-activeLine, .cm-activeLine": {
                    backgroundColor: highlightBackground,
                },
                "&.cm-focused .cm-cursor": {
                    borderLeftColor: "#fff"
                },
                "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
                  backgroundColor: "#233"
                }
            }, {dark: true}),
            languageConf.of(javascript()),
            autoLanguage,
            EditorView.domEventHandlers({
                "blur": () => dispatch(UpdateNode, {property: "value", value: code_editor.state.doc.sliceString(0, code_editor.state.doc.length, "\n")})
            })
        ], parent: document.getElementById(`${html_id}-code-editor`)});
    })
}

const error_nodes = (error) => error instanceof AggregateError || Array.isArray(error)
    ? (Array.isArray(error) ? error : error.errors)
        .map(e => e instanceof nolib.no.NodysseusError ? e.node_id : false).filter(n => n) 
    : error instanceof nolib.no.NodysseusError 
    ? [error.node_id] : []; 
const runapp = (init, load_graph, _lib) => {
        // return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
    return ha.app({
    init: [init, 
        [() => requestAnimationFrame(() => {
            result_display_dispatch = result_display(init.html_id);
            info_display_dispatch = info_display(init.html_id);
            custom_editor_display_dispatch = custom_editor_display(init.html_id)
            refresh_custom_editor()
            nolib.no.runtime.change_graph(base_graph(init.display_graph), hlib)
        })],
        [ChangeDisplayGraphId, {id: load_graph, select_out: true, display_graph_id: undefined}],
        [UpdateSimulation, {...init, action: SimulationToHyperapp}],
        [init_code_editor, {html_id: init.html_id}],
        [(dispatch) => requestAnimationFrame(() => autocomplete({
          input: document.getElementById("edit-text-ref"),
          emptyMsg: "not found",
          minLength: 0,
          fetch: (text, update) => {
            const refs = nolib.no.runtime.refs().map(r => ({id: r}));
            update(text === "" ? refs : new Fuse(refs, {keys: ["id"], distance: 80, threshold: 0.4}).search(text).map(searchResult => ({label: searchResult.item.id, value: searchResult.item.id})))
          },
          className: "ref-autocomplete-list",
          showOnFocus: true,
          onSelect: item => {
            document.getElementById("edit-text-ref").value = item.value;
            requestAnimationFrame(() => {
              dispatch([UpdateNode, {property: "ref", value: item.value}])
            })
          },
          render: item => {
            const itemEl = document.createElement("div")
            itemEl.className = "autocomplete-item"
            itemEl.textContent = item.value;
            return itemEl;
          }
        }))]
    ],
    dispatch: middleware,
    view: s =>ha.h('div', {id: s.html_id}, [
        ha.h('svg', {id: `${s.html_id}-editor`, width: s.dimensions.x, height: s.dimensions.y}, [
            ha.h('g', {id: `${s.html_id}-editor-panzoom`}, 
                [ha.memo(defs)].concat(
                    s.nodes?.map(node => {
                        const newnode = Object.assign({}, node, s.display_graph.nodes[node.node_id])
                        return ha.memo(node_el, ({
                            html_id: s.html_id, 
                            selected: s.selected[0] === node.node_id, 
                            error: !!error_nodes(s.error).find(e => e.startsWith(s.display_graph.id + "/" + node.node_id)), 
                            selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(node.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(node.node_id),
                            node_id: node.node_id,
                            node_name: newnode.name,
                            node_ref: newnode.ref,
                            node_value: newnode.value,
                            has_nodes: !!newnode.nodes,
                            nested_edge_count: newnode.nested_edge_count,
                            nested_node_count: newnode.nested_node_count
                        }))
                }) ?? []
                ).concat(
                    s.links?.map(link => ha.memo(link_el, {
                        link: Object.assign({}, link, s.display_graph.edges[link.source.node_id]),
                        selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(link.source.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(link.source.node_id),
                    })) ?? []
                ).concat(
                    s.links?.filter(link => link.source.node_id == s.selected[0] || link.target.node_id === s.selected[0])
                        .map(link => insert_node_el({link, randid: s.randid, node_el_width: s.node_el_width}))
                )
            ),
        ]),
        info_el({
            node: Object.assign({}, s.nodes.find(n => n.node_id === s.selected[0]), s.display_graph.nodes[s.selected[0]]),
            hidden: s.show_all,
            edges_in: s.selected_edges_in,
            link_out: Object.assign({}, s.links.find(l => l.source.node_id === s.selected[0]), s.display_graph.edges[s.selected[0]]),
            display_graph_id: s.display_graph.id,
            randid: s.randid,
            editing: s.editing,
            ref_graphs: nolib.no.runtime.ref_graphs(),
            html_id: s.html_id,
            copied_graph: s.copied?.graph,
            inputs: s.inputs,
            graph_out: s.display_graph.out
        }),
        ha.h('div', {id: `${init.html_id}-custom-editor-display`}),
        ha.h('div', {id: "graph-actions"}, [
            search_el({search: s.search, _lib}),
            ha.h('ion-icon', {
                    name: 'sync-outline', 
                    onclick: s => [s, [dispatch => { 
                            nolib.no.runtime.delete_cache(); 
                            hlib.run(s.display_graph, s.display_graph.out ?? "out", {_output: "value"});  
                            refresh_custom_editor()
                            requestAnimationFrame(() =>  dispatch(s => [s, [() => {
                                s.simulation.alpha(1); 
                                s.simulation.nodes([]); 
                            }], [UpdateSimulation]])) 
                        }]]
                }, 
                [ha.text('refresh')]
            )
        ]),
        ha.h('div', {id: `${init.html_id}-result`}),
        s.error && ha.h('div', {id: 'node-editor-error'}, run_h(show_error(s.error, s.error.node_id)))
    ]),
    node: document.getElementById(init.html_id),
    subscriptions: s => [
        [d3subscription, {action: SimulationToHyperapp, update: UpdateSimulation}], 
        [graph_subscription, {display_graph_id: s.display_graph_id}],
        [select_node_subscription, {}],
        result_display_dispatch && [result_subscription, {display_graph_id: s.display_graph_id, norun: s.norun}],
        [keydownSubscription, {action: (state, payload) => {
            if(document.getElementById("node-editor-result").contains(payload.target)) {
                return [state];
            }
            const mode = state.editing !== false ? 'editing' : state.search !== false ? 'searching' : 'graph';
            const key_input = (payload.ctrlKey ? 'ctrl_' : '') + (payload.shiftKey ? 'shift_' : '') + (payload.key === '?' ? 'questionmark' : payload.key.toLowerCase());
            let action;
            let effects = [];
            const selected = state.selected[0];
            switch(key_input) {
                case "ctrl_o": {
                    action = [SelectNode, {node_id: state.display_graph.out, focus_property: 'name'}]
                    payload.stopPropagation();
                    payload.preventDefault();
                    break;
                }
                default: {
                  const kbres = hlib.run(init.keybindings, "out");
                    wrapPromise(kbres).then(kb => {
                      const result = kb[mode][key_input];
                      switch(result){
                          case "up": {
                              const parent_edges = nolib.no.runtime.get_edges_in(state.display_graph, selected);
                              const node_id = parent_edges?.[Math.ceil(parent_edges.length / 2) - 1]?.from
                              action = node_id ? [SelectNode, {node_id}] : [state]
                              break;
                          }
                          case "down": {
                              const child_edge = Object.values(state.display_graph.edges).find(e => e.from === selected);
                              const node_id = child_edge?.to
                              action = node_id ? [SelectNode, {node_id}] : [state]
                              break;
                          }
                          case "left": 
                          case "right": {
                              const dirmult = result === "left" ? 1 : -1;
                              const current_node = nolib.no.runtime.get_node(state.display_graph, selected)
                              const siblings = state.levels.siblings.get(selected); 
                              const node_id = siblings.reduce((dist, sibling) => { 
                                  const sibling_node = state.nodes.find(n => n.node_id === sibling); 
                                  if(!sibling_node){ return dist } 
                                  const xdist = Math.abs(sibling_node.x - current_node.x); 
                                  dist = (dirmult * (sibling_node.x - current_node.x) < 0) && xdist < dist[0] ? [xdist, sibling_node] : dist; return dist 
                              }, [state.dimensions.x])?.[1]?.node_id; 
                              action = node_id ? [SelectNode, {node_id}] : [state]
                              break;
                          }
                          case "save": {
                              effects.push([SaveGraph, state])
                              break;
                          }
                          case "copy": {
                              action = [Copy, {as: nolib.no.runtime.get_edge_out(state.display_graph, state.selected[0]).as}];
                              break;
                          }
                          case "paste": {
                              action = [Paste];
                              break;
                          }
                          case "find": {
                              action = s => [{...s, search: ""}, [FocusEffect, {selector: "#search input"}]]; 
                              break;
                          }
                          case "expand_contract": {
                              action = [ExpandContract, {node_id: state.selected[0]}];
                              break;
                          }
                          case "delete_node": {
                              action = [DeleteNode, {
                                  node_id: state.selected[0]
                              }]
                              break;
                          }
                          case "edit_name": {
                              action = [SelectNode, { node_id: state.selected[0], focus_property: "name" }]
                              break;
                          }
                          case "edit_value": {
                              action = [SelectNode, { node_id: state.selected[0], focus_property: "value" }]
                              break;
                          }
                          case "edit_ref": {
                              action = [SelectNode, { node_id: state.selected[0], focus_property: "ref" }]
                              break;
                          }
                          case "edit_edge": {
                              action = [SelectNode, { node_id: state.selected[0], focus_property: "edge" }]
                              break;
                          }
                          case "end_editing": {
                              action = [state => [
                                  {...state, show_all: true, focused: false, editing: false},
                                  [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: true}))]
                              ]]
                              break;
                          }
                          case "undo": {
                            nodysseusStore.refs.undo()
                            break;
                          }
                          case "redo": {
                            nodysseusStore.refs.redo()
                            break;
                          }
                          default: {
                              if(result !== undefined) {
                                  console.log(`Not implemented ${result}`)
                              }
                              nolib.no.runtime.publish('keydown', {data: key_input})
                          }
                      }
                  })
                }
            }

            return action ? action : [state, ...effects];
        }}],
        listen('resize', s => [{
                ...s, 
                dimensions: {x: document.getElementById(init.html_id).clientWidth, y: document.getElementById(init.html_id).clientHeight}
            }, false && [() => nolib.no.runtime.publish('resize', {x: document.getElementById(init.html_id).clientWidth, y: document.getElementById(init.html_id).clientHeight})]
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
                [() => requestAnimationFrame(() => nolib.no.runtime.publish('show_all', {data: p.event !== 'effect_transform'}))]
            ]
        }]
    ], 
});
}

let main_app_dispatch;

const editor = async function(html_id, display_graph, lib, norun) {
    // nodysseusStore = await createStore();
    nodysseusStore = await yNodyStore();
    initStore(nodysseusStore)
    const simple = await resfetch("json/simple.json").then(r => r.json());
    // TODO: clean this up it's just used for side effect of initializing the db
    // run(simple);
    const url_params = new URLSearchParams(document.location.search);
    const graph_list = JSON.parse(localStorage.getItem("graph_list")) ?? [];
    const hash_graph = window.location.hash.substring(1);
    const keybindings = await resfetch("json/keybindings.json").then(r => r.json()).then(kb => (nolib.no.runtime.add_ref(kb), kb))

    // let stored_graph = JSON.parse(localStorage.getItem(hash_graph ?? graph_list?.[0]));
    // stored_graph = stored_graph ? base_graph(stored_graph) : undefined
    // await Promise.all(graph_list.map(id => localStorage.getItem(id)).filter(g => g).map(graph => JSON.parse(graph)).map(graph => Promise.resolve(nolib.no.runtime.add_ref(base_graph(graph)))))
    // Promise.resolve(stored_graph ?? (hash_graph ? resfetch(`json/${hash_graph}.json`).then(r => r.status !== 200 ? simple : r.json()).catch(_ => simple) : simple))
        // .then(display_graph => {

        const init = { 
            keybindings,
            display_graph_id: 'simple',
            display_graph: simple,
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
            imports: {},
            history: [],
            redo_history: [],
            selected: ["out"],
            inputs: {},
            selected_edges_in: []
        };

        main_app_dispatch = runapp(init,  hash_graph && hash_graph !== "" ? hash_graph : graph_list?.[0] ?? 'simple', lib)

    // })
}

const middleware = dispatch => (ha_action, ha_payload) => {
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

const runh = el => el.d && el.p && el.c && ha.h(el.d, el.p, el.c);

let nodysseusStore;

const ydocStore = async (persist = false, update = undefined) => {
  const ydoc = new Y.Doc();
  const ymap = ydoc.getMap();
  const simpleYDoc = new Y.Doc();
  const simpleYMap = simpleYDoc.getMap();


  if(update) {
    ymap.observe(event =>{
      console.log("event");
      console.log(event);
      if(!event.transaction.local || event.transaction.origin === undoManager) {
        update(event)
      }

      // for(let k of event.keysChanged) {
      //   if(ymap.get(k)?._map && !generic.nodes[k]) {
      //     add(k, ymap.get(k).toJSON())
      //   }
      // }

      simpleYDoc.transact(() => {
        for(let k of event.keysChanged) {
          if(ymap.get(k)?.isLoaded) {
            simpleYMap.set(k, ymap.get(k)?.getMap().toJSON())
          }
        }
      })
    })
  }

  const params = new URLSearchParams(location.search)
  let undoManager;

  const add = (id, data) => {
    if(generic.nodes[id]) {
      simpleYMap.set(id, generic.nodes[id])
      return generic.nodes[id];
    } else if(!id.startsWith("_") && Object.keys(data).length > 0) {
      console.log(`adding ${id}`)
      let current = ymap.get(id);
      let found = !!current?.guid; // && !!current.getMap().get("id");
      if(!found) {
        console.log("creating new ydoc")
        // debugger;
        current = new Y.Doc();
        // current.getMap().set("id", id)
        ymap.set(id, current);
        current.load()
      }

      return wrapPromise(current.isLoaded ? true : current.whenLoaded).then(_ => {
        ydoc.transact(() => {
          const infomap = generic.nodes[id] ? current : current.getMap();
          console.log('in loaded')
          console.log(infomap)
            // let infomap = current
            if(infomap.get("id") !== id) {
              infomap.set("id", id);
            }
            if(infomap.get("name") !== data.name) {
              infomap.set("name", data.name);
            }
            if(data.ref && data.ref !== infomap.get("ref")){
              infomap.set("ref", data?.ref);
            } else if(infomap.has('ref') && !data.ref) {
              infomap.delete('ref')
            }

            if(data.value && data.value !== infomap.get("value")){
              infomap.set("value", data?.value);
            } else if(infomap.has('value') && !data.value) {
              infomap.delete('value')
            }

            if(data.out && data.out !== infomap.get("out")){
              infomap.set("out", data?.out);
            } else if(infomap.has('out') && !data.out) {
              infomap.delete('out')
            }

            if(data.nodes)  {
              let nodesymap = infomap.get("nodes")
              if(!infomap.get("nodes")?.set) {
                nodesymap = new Y.Map();
                infomap.set("nodes", nodesymap)
              }
              if(Array.isArray(data.nodes)){
                data.nodes.map(n => nodesymap.set(n.id, n)) 
              } else {
                Object.entries(data.nodes).forEach(kv => nodesymap.set(kv[0], kv[1]))
              } 
              // let curnodes = infomap.get('nodes');
              // if(!curnodes) {
              //   curnodes = new Y.Map();
              //   infomap.set('nodes', curnodes);
              // }
              // data.nodes.forEach(n => curnodes.set(n.id, n))
            }

            if(data.edges) {
              let edgesymap = infomap.get("edges")
              if(!infomap.get("edges")?.set) {
                edgesymap = new Y.Map();
                infomap.set("edges", edgesymap)
              }

              if(Array.isArray(data.edges)){
                const edgeset = new Set(data.edges.map(e => e.from))
                if(edgeset.size !== data.edges.length) {
                  console.log(`invalid edges for ${data.id}`)
                  console.log(data.edges.filter(e => {
                    edgeset.has(e.from) ? edgeset.delete(e.from) : console.log(e.from)
                  }))
                }
                data.edges.map(e => edgesymap.set(e.from, e)) 
              } else {
                Object.entries(data.edges).forEach(kv => edgesymap.set(kv[0], kv[1]))
              } 
              // let curedges = infomap.get('edges');
              // if(!curedges) {
              //   curedges = new Y.Map();
              //   infomap.set('edges', curedges);
              // }
              // data.edges.forEach(e => curedges.set(e.to + "__" + e.from, e));
            }
          })

        updateSimple(id)

        return simpleYMap.get(id)
      }).value
    }
  }

  const updateSimple = id => {
    // simpleYDoc.transact(() => {
      // debugger;
    if(ymap.get(id).isLoaded) {
      simpleYMap.set(id, ymap.get(id).getMap().toJSON())
    } else {
      console.log(`not loaded ${id}`)
    }
    // })
  }

  const add_node = (graphId, node) => {
    if(generic.nodes[graphId]) return;

    ymap.get(graphId).transact(() => {
      ymap.get(graphId).getMap().get("nodes").set(node.id, node)
    })

    updateSimple(graphId)
  }

  const remove_node = (graphId, node) => {
    if(generic.nodes[graphId]) return;

    ydoc.transact(() => {
      ymap.get(graphId).getMap().get("nodes").delete(typeof node === "string" ? node : node.id)
    })

    updateSimple(graphId)
  }

  const add_edge = (graphId, edge) => {
    if(generic.nodes[graphId]) return;

    ydoc.transact(() => {
      ymap.get(graphId).getMap().get("edges").set(edge.from, edge)
    })

    updateSimple(graphId)
  }

  const remove_edge = (graphId, edge) => {
    ydoc.transact(() => {
      ymap.get(graphId).getMap().get("edges").delete(edge.from)
    })

    updateSimple(graphId)
  }

  if(persist) {
    const prevdoc = new Y.Doc();

    const indexeddbProvider = new IndexeddbPersistence(`${persist}-subdocs`, ydoc)
    await indexeddbProvider.whenSynced.then(val => {
      const runcustom = () => {
        if(!nolib.no.runtime){
          requestAnimationFrame(runcustom);
          return;
        }
      }

      requestAnimationFrame(runcustom)
    })

    const prevIndexeddbProvider = new IndexeddbPersistence(`${persist}`, prevdoc)
    await prevIndexeddbProvider.whenSynced.then(val => {
      Promise.all([...prevdoc.getMap().keys()].map(k => {
        console.log(`prevdoc ${k}`);
        // if(prevdoc.getMap().get(k).guid) {
        //   return;
        // }
        if(k.startsWith("_") || k === "" || generic.nodes[k] || ymap.has(k)) {
        } else if (prevdoc.getMap().get(k).id) {
          // convert old maps to ymap
          console.log(`old maps ${k}`)
          return add(k, prevdoc.getMap().get(k))
        } else if (Array.isArray(prevdoc.getMap().get(k).get("nodes"))) {
          console.log(`old nodes ${k}`)
          const graph = prevdoc.getMap().get(k);
          const nodes = graph.get("nodes");
          const edges = graph.get("edges");
          const updatedNodes = new Y.Map();
          const updatedEdges = new Y.Map();
          nodes.forEach(n => updatedNodes.set(n.id, n))
          edges.forEach(e => updatedEdges.set(e.from, e))
        } else if (prevdoc.getMap().get(k)?.get("nodes")) {
          console.log("readding")
          console.log(k);
          console.log(prevdoc.getMap().get(k))
          console.log(prevdoc.getMap().get(k).toJSON())
          return add(k, prevdoc.getMap().get(k).toJSON())
        }
      }))
    })

    undoManager = new Y.UndoManager(ymap)
    undoManager.on('stack-item-popped', i => console.log(i))

    // const url = await fetch("http://localhost:7071/api/Negotiate?userId=me").then(r => r.json())
    // console.log("syncing on ")
    // console.log(url.url)
    // const wsurl = new URL(url.url)

    // const wsprovider = new WebsocketProvider('wss://nodysseus.webpubsub.azure.com/client/hubs', 'collaboration', ydoc, {
    //   WebSocketPolyfill: NodyWS,
    //   params: {access_token: wsurl.searchParams.get('access_token')}
    // })
    //
    // const oldonmessage= wsprovider.ws.onmessage;
    // wsprovider.ws.onmessage = (v) => {
    //   oldonmessage(v)
    // }
  }

  // if(false) {
  const refIdbs = {};
  let rdoc;

  const setuprtc = (rtcroom, sd) => {
    if(!rdoc) {
      rdoc = new Y.Doc({autoLoad: true})
      rdoc.on('subdocs', e => {
        console.log('rdoc subdocs')
        console.log(e)
        // console.log("loaded rdoc")
        // if(!rdoc.getMap().has(sdmap.get("id"))) {
        //   console.log(`setting new map ${sdmap.get("id")}`)
        //   rdoc.getMap().set(sdmap.get("id"), new Y.Doc({guid: sd.guid}))
        // } else {
        //   console.log(`using existing map ${sdmap.get("id")}`)
        //   ydoc.getMap().set(sdmap.get("id"), new Y.Doc({guid: rdoc.getMap().get(sdmap.get("id")).guid}))
        //   updateSimple(sdmap.get("id"))
        // }

      })
      rdoc.getMap().observe(evt => {
        console.log("rdoc obs")
        console.log(evt)
      })
      const rdocrtc = new WebrtcProvider(`nodysseus${rtcroom}_subdocs`, rdoc, {signaling: ["wss://51.11.165.142:4444"]})
    }

    rdoc.getMap().set(sd.getMap().get("id"), sd)
  }

  ydoc.on('subdocs', e => {
        // console.log(url)
    console.log("subdocs")
    console.log(e);
    e.loaded.forEach(sd => {
      const sdmap = sd.getMap();
      if(!refIdbs[sd.guid]) {
        refIdbs[sd.guid] = new IndexeddbPersistence(`${persist}-subdocs-${sd.guid}`, sd)
        refIdbs[sd.guid].whenSynced.then(() => {
          if(sdmap.get("id")) {
            simpleYMap.set(sdmap.get("id"), ymap.get(sdmap.get("id")).getMap().toJSON())
          }
          sd.emit('load', [sd])
            // new WebsocketProvider(`nodysseus${rtcroom}_`+sd.getMap().get("id"), sd, {signaling: [url.url]})
            // new WebsocketProvider(url.baseUrl, "", /*`nodysseus${rtcroom}_${sd.getMap().get("id")}`*/ sd, {
            //   WebSocketPolyfill: NodyWS,
            //   params: {access_token: url.accessToken}
            // })
            //
            const custom_editor_res = nolib.no.runtime.get_ref("custom_editor");
            mapMaybePromise(custom_editor_res, custom_editor => {
              const rtcroom = params.get("rtcroom") ?? (custom_editor && hlib.run(custom_editor, custom_editor.out ?? "out")?.rtcroom);
              if(rtcroom && sdmap.get("id")) {
                console.log("gotrtcroom")
                console.log(rtcroom)
                console.log(sd.getMap().get("id"))

                setuprtc(rtcroom, sd);

                const grobs = new WebrtcProvider(`nodysseus${rtcroom}_${sd.getMap().get("id")}`, sd, {signaling: ["ws://51.11.165.142:4444"]})
              }
            })

            sd.getMap().observeDeep(event => {
              // console.log('rtcroom event sd')
              // console.log(event)
              // console.log(sd.getMap().toJSON())
              if(event[0].transaction.local === false) {
                updateSimple(sd.getMap().get("id"))
                update(event[0])
              }
            })
          sd.on('update', evt => {
            // console.log("got update")
            // console.log(sd.getMap().get("id"))
          })
            sd.on('synced', event => {
              console.log("synced")
              console.log(event);
              console.log(sd.guid)
              console.log(sd.getMap().toJSON())
            })
        })
      }
      simpleYMap.set(sdmap.get("id"), sdmap.toJSON())
    })
  })

  // }

  const get = (id, otherwise) => {
    // console.log(`getting ${id}`)
    // if(ymap.get(id).getMap && !ymap.get(id)._map) {
    //   add(id, ymap.get(id))
    // }

    // ymap.get(id).load()
    // const frommap = ymap.get(id)?.toJSON();
    // const res = frommap?.nodes && frommap?.edges ? {...frommap, nodes: frommap.nodes, edges: frommap.edges} : frommap;
    // const ymapRes = ymap.get(id);
    // if(!ymapRes.isLoaded) {
    //   ymapRes.load();
    // }
    // const res = simpleYMap.get(id);
      //frommap;

    // console.log(id);
    // console.log(res);
    // ymap.get(id).on('synced', evt => {
    //   debugger;
    // })
    // if(id === "simple") {
      // debugger;
    // }
    const genericGraph = generic.nodes[id];
    return genericGraph ?? mapMaybePromise(simpleYMap.get(id)?.id || ymap.get(id)?.isLoaded 
      ? simpleYMap.get(id) 
      : (ymap.get(id)?.load(), ymap.get(id)?.whenLoaded)?.then(d => d.getMap().toJSON()), res => {
      if(res && !res?.id) {
        debugger;
      }
      if(!res || Object.keys(res).length === 0) {
        const val = {...extend(true, {}, get("simple"))};
        val.id = id;
        val.nodes.out.name = id;
        console.log("creating new " + id)
        return add(id, otherwise ?? val)
      }

      return res;
    });
  }

  return {
    get,
    add,
    add_node,
    remove_node,
    add_edge,
    remove_edge,
    addMany: (datas) => {
      ydoc.transact(() => {
        datas.forEach(([id, data]) => add(id, data))
      })
    },
    remove: id => {
      ymap.delete(id)
    },
    removeAll: () => {},
    all: () => {
      const keys = [...simpleYMap.keys()];
      // keys.forEach(k => (k.match(/^[a-z0-9]{7}$/) || k.match(/^run_[a-z]{7}.*/)) && k !== 'default' && k !== 'resolve' && k !== 'changed' && ymap.delete(k))
      return keys//.map(v => get(v))
    },
    undo: persist && (() => undoManager.undo()),
    redo: persist && (() => undoManager.redo()),
  }
}
const yNodyStore = async () => {
    const db = new loki("nodysseus.db", {
      env: "BROWSER",
      persistenceMethod: "memory",
    });

  const graphsdb = db.addCollection("graphs", { unique: ["id"] });
  const statedb = db.addCollection("state", { unique: ["id"] });
  const fnsdb = db.addCollection("fns", { unique: ["id"] });
  const parentsdb = db.addCollection("parents", { unique: ["id"] });
  let nodysseusidb;

  openDB("nodysseus", 2, {
    upgrade(db) {
      db.createObjectStore("assets")
    }
  }).then(db => { nodysseusidb = db })

  return {
    refs: await ydocStore('refs', (event, id) => {
      if(!main_app_dispatch || (!id && event.keysChanged.size > 1)) {
        return;
      }

      const updatedgraph = id ?? event.currentTarget.get("id");
      if(updatedgraph) {
        requestAnimationFrame(() =>  {
          console.log(updatedgraph);
          console.log(nolib.no.runtime.get_ref(updatedgraph))
          nolib.no.runtime.change_graph(nolib.no.runtime.get_ref(updatedgraph), {...nolib, ...hlib}, event.transaction.local)
        }) 
      }
    }),
    parents: lokidbToStore(parentsdb),
    graphs: lokidbToStore(graphsdb),
    state: lokidbToStore(statedb),
    fns: lokidbToStore(fnsdb),
    assets: {
      get: (id) => nodysseusidb.get('assets', id),
      add: (id, blob) => nodysseusidb.put('assets', blob, id),
      remove: id => nodysseusidb.delete('assets', id),
      removeAll: () => nodysseusidb.clear('assets'),
      all: () => nodysseusidb.getAll(),
      addMany: bs => bs.map(([id, b]) => nodysseus.idb.add('assets', b, id))
    }
  }
}

const hlib = {
    ...nolib,
    ha: { 
        middleware, 
        h: {
            args: ['dom_type', 'props', 'children', 'memo'], 
            fn: (dom_type, props, children, usememo) => usememo ? ha.memo(runh, {d: dom_type, p: props, c: children}) : runh({d: dom_type, p: props, c: children})}, 
        app: ha.app, 
        text: {args: ['text'], fn: ha.text}
    },
    scripts: { d3subscription, updateSimulationNodes, keydownSubscription, calculateLevels, listen, graph_subscription, result_subscription, save_graph},
    effects: {
        position_by_selected: (id, selected, dimensions, nodes) => {
            selected = Array.isArray(selected) ? selected[0] : selected;
            const el = document.getElementById(id.replaceAll("/", "_"));
            const node = nodes.find(n => n.id === selected);
            const x = node.x;
            const y = node.y;
            const svg_offset = hlib.panzoom.getTransform();
            el.setAttribute("left",  `${Math.min(x * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0) - 64, dimensions.x - 256)}px`);
            el.setAttribute("top", `${y * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0) + 32}px`);
        }
    },
    add_asset: (id, b) => nodysseusStore.assets.add(id, b),
    get_asset: (id, b) => id && nodysseusStore.assets.get(id),
    remove_asset: id => nodysseusStore.assets.remove(id),
    panzoom: pzobj,
    run: (graph, fn, args, lib) => run({graph, fn, lib: lib ? {...hlib, ...lib} : hlib}, args, nodysseusStore),
    run_runnable: (runnable, args) => run(runnable, args, nodysseusStore),
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX }
}

export { editor, run }
