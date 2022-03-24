import { bfs, hashcode, add_default_nodes_and_edges, nolib, runGraph, expand_node, flattenNode, contract_node, calculateLevels, contract_all, ispromise, resolve } from "./nodysseus";
import DEFAULT_GRAPH from "../public/json/pull.json"
import simple_html_hyperapp from "../public/json/simple_html_hyperapp.json"
import simple from "../public/json/simple.json"
import { h, app, text, memo } from "hyperapp"
import panzoom from "panzoom";
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";

const updateSimulationNodes = (dispatch, data) => {
    if(data.static) {
        const find_childest = n => {
            const e = graph.edges.find(e => e.from === n);
            if (e) {
                return find_childest(e.to);
            } else {
                return n;
            }
        }
        const top = data.display_graph.out;
        const levels = new Map();
        const nodes = new Map();
        bfs(data.display_graph, (id, level) => {
            levels.set(id, Math.min(levels.get(id) ?? Number.MAX_SAFE_INTEGER, level));
            nodes.set(id, data.display_graph.nodes.find(n => n.id === id));
        })(top, 0);

        const parents = new Map([...nodes.values()].map(n => {
            const nps = data.display_graph.edges.filter(e => e.to === n.id).map(e => e.from);
            return [ n.id, nps]
        }));

        [...parents.values()].forEach(nps => {
            nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
            for(let i = 0; i < nps.length * 0.5; i++) {
                if(i % 2 === 1) {
                    const tmp = nps[i];
                    const endidx = nps.length - 1 - Math.floor(i / 2)
                    nps[i] = nps[endidx];
                    nps[endidx] = tmp;
                }
            }
        })

        const children = new Map([...nodes.values()]
            .map(n => [n.id, data.display_graph.edges
            .filter(e => e.from === n.id)
            .map(e => e.to)]
        ));

        const nodes_by_level = [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {});

        const node_el_width = 196;
        const node_positions = new Map();
        [...nodes.values()].forEach(n => {
            const child = children.get(n.id)?.length ? children.get(n.id)[0] : 0;
            const parents_count = Math.min(8, parents.get(n.id)?.length) ?? 0;
            const siblings = children.get(n.id)?.length ? parents.get(children.get(n.id)[0]) : [n.id];
            const sibling_count = Math.max(siblings.length, 4);
            let increment = Math.PI * 2 / (Math.max(1, sibling_count - 1) * (Math.pow(Math.PI, 2 * (levels.get(n.id) - 1)) + 1));
            increment = Math.max(increment, .05);
            const offset = child ? node_positions.get(child)[2] : 0;
            let theta = ((siblings.findIndex(l => l == n.id) - (siblings.length === 1 ? 0 : 0.5)) * increment) + offset;
            const dist = !child ? 0 : (node_el_width * 0.75
                + node_positions.get(child)[3]
                + node_el_width * 0.25 * parents_count
            );

                //+ (child ? node_positions.get(child)[3] : 0);

            node_positions.set(n.id,
                [
                    n,
                    n.id + (children.get(n.id)?.length ? '_' + children.get(n.id)[0] : ''),
                    theta,
                    dist
                ])
        });

        for(let np of node_positions.values()) {
            const theta = np[2];
            const dist = np[3];
            np[2] = -dist * Math.cos(theta);
            np[3] = -dist * Math.sin(theta);
        }

        const node_data = {
            nodes: [...node_positions.values()].map(([n, c, x, y]) => ({
                node_id: n.id,
                node_child_id: c,
                nested_node_count: n.nodes?.length,
                nested_edge_count: n.edges?.length,
                x,
                y
            })),
            links: data.display_graph.edges.filter(e => levels.has(e.to)).map(e => ({
                source: {
                    node_child_id: node_positions.get(e.from)[1],
                    node_id: node_positions.get(e.from)[0].id,
                    x: Math.floor(node_positions.get(e.from)[2]),
                    y: Math.floor(node_positions.get(e.from)[3])
                },
                target: {
                    node_child_id: node_positions.get(e.to)[1],
                    node_id: node_positions.get(e.to)[0].id,
                    x: Math.floor(node_positions.get(e.to)[2]),
                    y: Math.floor(node_positions.get(e.to)[3])
                },
                sibling_index_normalized: 0
            }))
        }
        requestAnimationFrame(() => {
            dispatch(s => s ? [resolve(data.sim_to_hyperapp), node_data] : s)
            requestAnimationFrame(() => {
                node_data.nodes.forEach(n => {
                    const el = document.getElementById(`${data.html_id}-${n.node_child_id}`);
                    if(el) {
                        const x = n.x - node_el_width * 0.5;
                        const y = n.y ;
                        el.setAttribute('x', Math.floor(x - 20));
                        el.setAttribute('y', Math.floor(y - 20));
                    }
                });

                node_data.links.forEach(l => {
                    const el = document.getElementById(`link-${l.source.node_child_id}`);
                    const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
                    const insert_el = document.getElementById(`insert-${l.source.node_child_id}`);
                    if(el && info_el) {
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

                        info_el.setAttribute('x', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.x - source.x) + source.x) + 16)
                        info_el.setAttribute('y', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.y - source.y) + source.y));

                        if(insert_el) {
                            insert_el.setAttribute('x', Math.floor(Math.floor((source.x + target.x) * 0.5)))
                            insert_el.setAttribute('y', Math.floor(Math.floor((source.y + target.y) * 0.5)))
                        }
                    }
                });

                dispatch(s => s?.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, ...node_data, selected: s.selected[0]}]] : s);
            })
        })
        return;
    }

    const simulation_node_data = new Map();
    data.simulation.nodes().forEach(n => {
        simulation_node_data.set(n.node_child_id, n)
    });

    const start_sim_node_size = simulation_node_data.size;
    
    const simulation_link_data = new Map();
    data.simulation.force('links').links().forEach(l => {
        simulation_link_data.set(l.source.node_child_id, l);
    })

    const start_sim_link_size = simulation_link_data.size;

    const main_node_map = new Map();

    const node_map = new Map(data.display_graph.nodes.map(n => [n.id, n]));
    const children_map = new Map(data.display_graph.nodes.map(n => [n.id, 
        data.display_graph.edges
            .filter(e => e.from === n.id)
            .map(e => e.to)
    ]));

    const order = [];
    const queue = [data.display_graph.out];

    const parents_map = new Map(data.display_graph.nodes.map(n => [n.id, 
        data.display_graph.edges
            .filter(e => e.to === n.id)
            .map(e => e.from)
        ]));

    while(queue.length > 0) {
        const node = queue.shift();
        order.push(node);

        const children = children_map.get(node);
        const node_child_id = children.length > 0 ? node + "_" + children[0] : node;
        main_node_map.set(node, node_child_id);

        parents_map.get(node).forEach(p => {queue.push(p)})
    }


    for(let ps of parents_map.values()) {
        let i = 0;
        ps.sort((a, b) => parents_map.get(a).length === parents_map.get(b).length 
            ? (simulation_node_data.get(main_node_map.get(a))?.hash ?? hashcode(a)) - (simulation_node_data.get(main_node_map.get(b)) ?? hashcode(b))
            : ((i++ % 2) * 2 - 1) * (parents_map.get(b).length - parents_map.get(a).length))
    }
    //// pushes all root nodes, not just display_graph.out
    // data.display_graph.nodes.forEach(n => {
    //     const children = children_map.get(n.id);
    //     const node_child_id = children.length > 0 ? n.id + "_" + children[0] : n.id;
    //     main_node_map.set(n.id, node_child_id);

        // if(children_map.get(n.id).length === 0) {
        //     queue.push(n.id);
        // }
    // });
    

    const nodes = order.flatMap(nid => {
        let n = node_map.get(nid);
        const children = children_map.get(n.id);
        const node_child_id = main_node_map.get(n.id);

        const node_hash = simulation_node_data.get(node_child_id)?.hash ?? hashcode(nid);
        const randpos = {x: (((node_hash * 0.254) % 256.0) / 256.0), y: ((node_hash * 0.874) % 256.0) / 256.0};

        const addorundefined = (a, b) => {
            return a === undefined || b === undefined ? undefined : a + b
        }

        const calculated_nodes = children.length === 0 ? [{
            node_id: n.id,
            node_child_id: n.id,
            hash: simulation_node_data.get(node_child_id)?.hash ?? hashcode(n.id),
            nested_node_count: n.nodes?.length,
            nested_edge_count: n.edges?.length,
            x: Math.floor(simulation_node_data.get(node_child_id)?.x 
                ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
            y: Math.floor(simulation_node_data.get(node_child_id)?.y 
                ?? addorundefined(simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y, 128)
                ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
        }] : children.map((c, i) => ({
            node_id: n.id,
            node_child_id: n.id + "_" + c,
            hash: simulation_node_data.get(node_child_id)?.hash ?? hashcode(n.id),
            sibling_index_normalized: parents_map.get(c).findIndex(p => p === n.id) / parents_map.get(c).length,
            nested_node_count: n.nodes?.length,
            nested_edge_count: n.edges?.length,
            x: Math.floor(simulation_node_data.get(node_child_id)?.x 
                ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                ?? addorundefined(
                    simulation_node_data.get(main_node_map.get(children_map.get(n.id)?.[0]))?.x, 
                    (parents_map.get(children_map.get(n.id)?.[0])?.findIndex(v => v === n.id) - (parents_map.get(children_map.get(n.id)?.[0])?.length - 1) * 0.5) * 256
                )
                ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
            y: Math.floor(simulation_node_data.get(node_child_id)?.y 
                ?? addorundefined(256, simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y)
                ?? addorundefined(
                    -(196 + 32 * (parents_map.get(n.id).length ?? 0)),
                    simulation_node_data.get(main_node_map.get(children_map.get(n.id)?.[0]))?.y
                )
                ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
        }));

        calculated_nodes.map(n => simulation_node_data.set(n.node_child_id, n));

        return calculated_nodes;
    })

    const links = data.display_graph.edges
        .filter(e => main_node_map.has(e.from) && main_node_map.has(e.to))
        .map(e => {
            if (!(main_node_map.has(e.from) && main_node_map.has(e.to))) {
                // won't throw - just doesn't display non main-graph nodes
                throw new Error(`edge node undefined ${main_node_map.has(e.from) ? '' : '>'}${e.from} ${main_node_map.has(e.to) ? '' : '>'}${e.to} `);
            }

            const l = simulation_link_data.get(e.from + "_" + e.to);
            return {
                source: e.from + "_" + e.to,
                from: e.from,
                to: e.to,
                target: main_node_map.get(e.to),
                sibling_index_normalized: simulation_node_data.get(e.from + "_" + e.to).sibling_index_normalized,
                strength: 2 * (1.5 - Math.abs(simulation_node_data.get(e.from + "_" + e.to).sibling_index_normalized - 0.5)) / (1 + 2 * Math.min(4, (parents_map.get(main_node_map.get(e.from))?.length ?? 0))),
                distance: 128 
                    + 16 * (Math.min(4, parents_map.get(main_node_map.get(e.to))?.length ?? 0)) 
            };
        }).filter(l => !!l);


    if (typeof (links?.[0]?.source) === "string") {
        if (
            simulation_node_data.size !== start_sim_node_size ||
            simulation_link_data.size !== start_sim_link_size || 
            data.simulation.nodes()?.length !== nodes.length ||
            data.simulation.force('links')?.links().length !== links.length) {
            data.simulation.alpha(0.4);
        }

        data.simulation.nodes(nodes);
        data.simulation.force('links').links(links);
        // data.simulation.force('fuse_links').links(data.fuse_links);
    }

    data.simulation.force('link_direction')
        .y(n =>
            (((parents_map.get(n.node_id)?.length > 0 ? 1 : 0)
                + (children_map.get(n.node_id)?.length > 0 ? -1 : 0)
                + (children_map.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + children_map.get(n.node_id)[0] ? -1 : 0))
                * 8 + .5) * window.innerHeight)
        .strength(n => (!!parents_map.get(n.node_id)?.length === !children_map.get(n.node_id)?.length)
            || children_map.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + children_map.get(n.node_id)[0] ? .025 : 0);


    data.simulation.force('collide').radius(96);
    // data.simulation.force('center').strength(n => (levels.parents_map.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children_map.get(n.node_id)?.length ?? 0) * 0.25)
}

const editor = function(html_id, display_graph) {
    const url_params = new URLSearchParams(document.location.search);
    const examples = [simple_html_hyperapp, simple];
    const dispatch = runGraph(DEFAULT_GRAPH, "initialize_hyperapp_app", { 
        graph: DEFAULT_GRAPH, 
        display_graph: add_default_nodes_and_edges(display_graph),
        hash: window.location.hash ?? "",
        url_params,
        html_id,
        dimensions: {
            x: document.getElementById(html_id).clientWidth,
            y: document.getElementById(html_id).clientHeight
        },
        examples: examples.map(add_default_nodes_and_edges),
        readonly: false, 
        norun: url_params.get("norun") !== null,
        hide_types: false,
        offset: {x: 0, y: 0}
    }, hlib);

    return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
}

// Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
// This is probably doing too much.
const d3subscription = (dispatch, props) => {
    const simulation = hlib.d3.forceSimulation()
        .force('charge', hlib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(64).strength(0))
        .force('collide', hlib.d3.forceCollide(64))
        .force('links', hlib.d3
            .forceLink([])
            .distance(l => l.distance ?? 128)
            .strength(l => l.strength)
            .id(n => n.node_child_id))
        .force('link_direction', hlib.d3.forceY().strength(.01))
        .force('center', hlib.d3.forceCenter().strength(0.01))
        // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_child_id))
        // .force('link_siblings', lib.d3.forceX().strength(1))
        // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
        .velocityDecay(0.7)
        .alphaMin(.25);

    const abort_signal = { stop: false };
    simulation.stop();
    let htmlid;
    let stopped = false;
    let selected;
    let dimensions;
    const node_el_width = 256;
    const tick = () => {
        if(simulation.nodes().length === 0) {
            dispatch(s => [(htmlid = s.html_id, {...s, simulation}), [props.update, s]]);
        }

        const data = {
            nodes: simulation.nodes().map(n => {
                return ({ ...n, x: ( Math.floor(n.x)), y: Math.floor(n.y) })
            }),
            links: simulation.force('links').links().map(l => ({
                ...l,
                as: l.as,
                type: l.type,
                source: ({
                    node_child_id: l.source.node_child_id,
                    node_id: l.source.node_id,
                    x: Math.floor(l.source.x),
                    y: Math.floor(l.source.y)
                }),
                target: ({
                    node_child_id: l.target.node_child_id,
                    node_id: l.target.node_id,
                    x: Math.floor(l.target.x),
                    y: Math.floor(l.target.y)
                })
            }))};


        if (simulation.alpha() > simulation.alphaMin()) {
            const ids = simulation.nodes().map(n => n.node_id).join(',');
            stopped = false;
            simulation.tick();
            dispatch([s => (selected = s.selected[0], dimensions = s.dimensions, 
                s.nodes.map(n => n.node_id).join(',') !== ids ? [props.action, data] 
                    : s.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, nodes: simulation.nodes().map(n => ({...n, x: n.x - 8, y: n.y})), links: simulation.force('links').links(), prevent_dispatch: true, selected: s.selected[0]}]] : s)]);

            const visible_nodes = [];
            const visible_node_set = new Set();
            let selected_pos;

            simulation.nodes().map(n => {
                const el = document.getElementById(`${htmlid}-${n.node_child_id}`);
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
                const el = document.getElementById(`link-${l.source.node_child_id}`);
                const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
                const insert_el = document.getElementById(`insert-${l.source.node_child_id}`);
                if(el && info_el) {
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

                    info_el.setAttribute('x', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.x - source.x) + source.x) + 16)
                    info_el.setAttribute('y', Math.floor((l.sibling_index_normalized * 0.2 + 0.2) * (target.y - source.y) + source.y));

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
            stopped = true; 
            dispatch([props.action, data])
            requestAnimationFrame(() => {
                dispatch(s => s?.panzoom_selected_effect ? [s, [s.panzoom_selected_effect, {...s, selected: s.selected[0]}]] : s)
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
        if (ev.key === "s" && ev.ctrlKey) {
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
    const listener = (graph) => {
        requestAnimationFrame(() =>  {
            dispatch(s => [{...s, display_graph: graph}, [s.update_sim_effect]])
        })
    };

    nolib.no.runtime.add_listener(props.graph, 'graphchange', 'update_hyperapp', listener);
    return () => nolib.no.runtime.remove_listener(props.graph, 'graphchange', 'update_hyperapp');
}

const listen = (type, action) => [listenToEvent, {type, action}]

const listenToEvent = (dispatch, props) => {
    const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event.detail))

    requestAnimationFrame(() => addEventListener(props.type, listener));
    return () => removeEventListener(props.type, listener);
}

const result_subscription = (dispatch, props) => {
    const listener = (graph, result) =>
        requestAnimationFrame(() => 
            dispatch(s => Object.assign({}, s, {error: false}, result)));
    

    const error_listener = (graph, error) =>
        requestAnimationFrame(() => dispatch(s => Object.assign({}, s, {error, display_graph: graph})))

    nolib.no.runtime.add_listener(props.graph, 'graphrun', 'update_hyperapp_result_display', listener);
    nolib.no.runtime.add_listener(props.graph, 'grapherror', 'update_hyperapp_error', error_listener);

    return () => (
        nolib.no.runtime.remove_listener(props.graph, 'graphrun', 'update_hyperapp_result_display', listener),
        nolib.no.runtime.remove_listener(props.graph, 'grapherror', 'update_hyperapp_error', error_listener)
    );
}

const findViewBox = (nodes, links, selected, node_el_width, htmlid, dimensions) => {
    const visible_nodes = [];
    const visible_node_set = new Set();
    let selected_pos;
    links.forEach(l => {
        const el = document.getElementById(`link-${l.source.node_child_id}`);
        const info_el = document.getElementById(`edge-info-${l.source.node_child_id}`);
        if(el && info_el) {
            const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
            const target = {x: l.target.x - node_el_width * 0.5, y: l.target.y};

            if (l.source.node_id === selected) {
                visible_nodes.push({x: target.x, y: target.y});
                visible_node_set.add(l.target.node_id);
            } else if (l.target.node_id === selected) {
                visible_nodes.push({x: source.x, y: source.y});
                visible_node_set.add(l.source.node_id);
            }
        }
    });

    links.forEach(l => {
        if(visible_node_set.has(l.target.node_id) && !visible_node_set.has(l.source.node_id)) {
            const source = {x: l.source.x - node_el_width * 0.5, y: l.source.y};
            visible_nodes.push({x: source.x, y: source.y});
        }
    });

    nodes.forEach(n => {
        const el = document.getElementById(`${htmlid}-${n.node_child_id}`);
        if(el) {
            const x = n.x - node_el_width * 0.5;
            const y = n.y ;

            if(n.node_id === selected) {
                visible_nodes.push({x, y})
                selected_pos = {x, y};
            }
        }
    });

    const nodes_box = visible_nodes.reduce((acc, n) => ({min: {x: Math.min(acc.min.x, n.x - 24), y: Math.min(acc.min.y, n.y - 24)}, max: {x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24), y: Math.max(acc.max.y, n.y + 24)}}), {min: {x: selected_pos ? (selected_pos.x - 96) : dimensions.x , y: selected_pos ? (selected_pos.y - 256) : dimensions.y}, max: {x: selected_pos ? (selected_pos.x + 96) : -dimensions.x, y: selected_pos ? (selected_pos.y + 128) : -dimensions.y}})
    const nodes_box_center = {x: (nodes_box.max.x + nodes_box.min.x) * 0.5, y: (nodes_box.max.y + nodes_box.min.y) * 0.5}; 
    const nodes_box_dimensions = {x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, (nodes_box.max.x - nodes_box.min.x))), y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, (nodes_box.max.y - nodes_box.min.y)))}
    const center = !selected_pos ? nodes_box_center : {x: (selected_pos.x + nodes_box_center.x * 3) * 0.25, y: (selected_pos.y + nodes_box_center.y * 3) * 0.25}

    return {nodes_box_dimensions, center};
}

const middleware = dispatch => (ha_action, ha_payload) => {
    const is_action_array_payload = Array.isArray(ha_action) 
        && ha_action.length === 2
        && (typeof ha_action[0] === 'function' 
                || (ha_action[0].hasOwnProperty('fn') 
                    && ha_action[0].hasOwnProperty('graph')));

    const is_action_obj_payload = typeof ha_action === 'object' 
        && ha_action.hasOwnProperty('fn') 
        && ha_action.hasOwnProperty('graph') 
        && ha_action.hasOwnProperty('args');
    const action = is_action_array_payload ? ha_action[0] : ha_action;
    const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {...ha_action.args, event: ha_payload} : ha_payload;

    return typeof action === 'object' && action.hasOwnProperty('fn') && action.hasOwnProperty('graph')
        ? dispatch((state, payload) => {
            try {
                const execute_graph_fn = nolib.no.executeGraphNode({graph: action.graph, lib: hlib})(action.fn);
                Object.defineProperty(execute_graph_fn, 'name', {value: action.fn, writable: false});
                const result = action.stateonly 
                    ? execute_graph_fn(state)
                    : execute_graph_fn({state, payload});

                if(!result) {
                    return state;
                }

                const effects = (result.effects ?? []).filter(e => e).map(e => {
                    if(typeof e === 'object' 
                    && e.hasOwnProperty('fn') 
                    && e.hasOwnProperty('graph')) {
                        const effect_fn = nolib.no.executeGraphNode({graph: e.graph})(e.fn);
                        Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
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

const runh = el => h(el.d, el.p, el.c);

const hlib = {
    ha: { 
        middleware, 
        h: {args: ['dom_type', 'props', 'children'], fn: (dom_type, props, children) => runh({d: dom_type, p: props, c: children})}, 
        app, 
        text: {args: ['text'], fn: text}, 
        memo: {args: ['view', 'props'], fn: memo} 
    },
    scripts: { d3subscription, updateSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all, listen, graph_subscription, result_subscription},
    pz: {
    panzoom: (dispatch, sub_payload) => {
            let instance;
            let lastpanzoom = 0;
            const panzoom_selected_effect = (dispatch, payload) => {
                if(!instance || !payload.selected){ return; }
                lastpanzoom = performance.now();
                const viewbox = findViewBox(
                    payload.nodes, 
                    payload.links, 
                    typeof payload.selected === 'string' ? payload.selected : payload.selected[0], 
                    payload.node_el_width, 
                    payload.html_id,
                    payload.dimensions
                );
                const x = payload.dimensions.x * 0.5 - viewbox.center.x;
                const y = payload.dimensions.y * 0.5 - viewbox.center.y
                const scale = instance.getTransform().scale;
                instance.moveTo(x, y);
                instance.zoomTo(x, y, 1 / scale)

                if(!payload.prevent_dispatch) {
                    dispatch(sub_payload.action, {event: 'effect_transform', transform: instance.getTransform()})
                }
            }

            let init = requestAnimationFrame(() => {
                instance = panzoom(document.getElementById(sub_payload.id), {
                    // onTouch: e => false,
                    filterKey: e => true,
                    smoothScroll: false
                });
                instance.on('panstart', e => performance.now() - lastpanzoom > 100 ? dispatch(sub_payload.action, {event: 'panstart', transform: e.getTransform()}) : undefined);
                instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
            });
            requestAnimationFrame(() => dispatch(s => [{...s, panzoom_selected_effect}]));
            return () => { cancelAnimationFrame(init); instance?.dispose(); }
        }
    },
    runGraph: (graph, node, args, lib) => nolib.no.runGraph(graph, node, args, {...hlib, ...(lib ?? {})}),
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX }
}

export { editor }