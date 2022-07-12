import { resfetch, bfs, hashcode, nolib, runGraph, calculateLevels, ispromise, resolve, base_graph, base_node } from "./nodysseus.mjs";
import * as ha from "hyperapp";
import panzoom from "panzoom";
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";
import { basicSetup, EditorView } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

const updateSimulationNodes = (dispatch, data) => {
    const simulation_node_data = new Map();
    data.simulation.nodes().forEach(n => {
        simulation_node_data.set(n.node_id, n)
    });

    const start_sim_node_size = simulation_node_data.size;
    
    const simulation_link_data = new Map();
    data.simulation.force('links').links().forEach(l => {
        simulation_link_data.set(l.source.node_id, l);
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

        main_node_map.set(node, node);

        parents_map.get(node).forEach(p => {queue.push(p)})
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
            nested_node_count: n.nodes?.length,
            nested_edge_count: n.edges?.length,
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
            nested_node_count: n.nodes?.length,
            nested_edge_count: n.edges?.length,
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

    const links = data.display_graph.edges
        .filter(e => main_node_map.has(e.from) && main_node_map.has(e.to))
        .map(e => {
            if (!(main_node_map.has(e.from) && main_node_map.has(e.to))) {
                // won't throw - just doesn't display non main-graph nodes
                throw new Error(`edge node undefined ${main_node_map.has(e.from) ? '' : '>'}${e.from} ${main_node_map.has(e.to) ? '' : '>'}${e.to} `);
            }

            const l = simulation_link_data.get(e.from);
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
                const el = document.getElementById(`${htmlid}-${n.node_id}`);
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
                const info_el = document.getElementById(`edge-info-${l.source.node_id}`);
                const insert_el = document.getElementById(`insert-${l.source.node_id}`);
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

const flattenNode = (graph, levels = -1) => {
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }

    // needs to not prefix base node because then flatten node can't run  next
    const prefix = graph.id ? `${graph.id}/` : '';
    const prefix_name = graph.id ? `${graph.name}/` : '';

    return graph.nodes
        .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` }))
        .map(g => flattenNode(g, levels - 1))
        .reduce((acc, n) => Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes ? n.flat_nodes.flat() : []).map(fn => {
                // adjust for easy graph renaming
                if ((fn.id === prefix + (graph.out || "out")) && graph.name) {
                    fn.name = graph.name;
                }
                return fn
            }),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                    Object.assign({}, e, { to: `${e.to}/${n.in || 'in'}` }) :
                    e.from === n.id ?
                        Object.assign({}, e, { from: `${e.from}/${n.out || 'out'}` }) :
                        e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes
                .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` })),
            flat_edges: graph.edges
                .map(e => ({ ...e, from: `${prefix}${e.from}`, to: `${prefix}${e.to}` }))
        }));
}


const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return { display_graph: data.display_graph, selected: [data.node_id] };
    }

    const flattened = flattenNode(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === node_id ? node.id + "/" + (node.out || 'out') : e.from,
                to: e.to === node_id ? node.id + "/" + (node.in || 'in') : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [node_id + '/' + (node.out || 'out')] };
}

const contract_node = (data, keep_expanded = false) => {
    const node = data.display_graph.nodes.find(n => n.id === data.node_id);
    const node_id = data.node_id;
    if (!node.nodes) {
        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];
        let args_edge;

        while (q.length > 0) {
            const e = q.shift();

            if(e.to === node.id && e.as === 'args') {
                args_edge = e;
            }

            in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                inside_edges.add(ie)
            });
            in_edge = in_edge.filter(ie => ie.from !== e.from);

            const old_node = inside_nodes.find(i => e.from === i.id);
            let inside_node = old_node || Object.assign({}, data.display_graph.nodes.find(p => p.id === e.from));

            inside_node_map.set(inside_node.id, inside_node);
            inside_edges.add(e);
            if (!old_node) {
                delete inside_node.inputs;
                inside_nodes.push(inside_node);
            }

            if (!args_edge || e.from !== args_edge.from) {
                nolib.no.runtime.get_edges_in(data.display_graph, e.from).forEach(de => q.push(de));
            }
        }

        let in_node_id = args_edge ? args_edge.from : undefined;

        // just return the original graph if it's a single node 
        if (in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node_id = data.node_id;

        const in_node = inside_node_map.get(in_node_id);

        let node_id_count = data.display_graph.nodes.filter(n => n.id === node_id).length;
        let final_node_id = node_id_count === 1 ? node_id : `${node_id}_${node_id_count}`

        const edges = [];
        for (const e of inside_edges) {
            edges.push({
                ...e,
                from: e.from.startsWith(node_id + "/")
                    ? e.from.substring(node_id.length + 1)
                    : e.from,
                to: e.to.startsWith(node_id + "/")
                    ? e.to.substring(node_id.length + 1)
                    : e.to
            })
        }

        const new_display_graph = {
            nodes: data.display_graph.nodes
                .filter(n => n.id !== data.node_id)
                .filter(n => keep_expanded || !inside_node_map.has(n.id))
                .concat([{
                    id: final_node_id,
                    name: node.name,
                    in: in_node_id && in_node_id.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
                    out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
                    nodes: inside_nodes.map(n => ({
                        ...n,
                        id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
                    })),
                    edges
                }]),
            edges: data.display_graph.edges
                .filter(e => keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to)))
                .map(e =>
                    e.from === data.node_id ? { ...e, from: final_node_id }
                        : e.to === in_node && in_node.id ? { ...e, to: final_node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: final_node_id }
                                : e
                )
        };

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [final_node_id] };
    }
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
    const listener = (graph) => {
        if(props.display_graph_id === graph.id) {
            requestAnimationFrame(() =>  {
                dispatch(s => [{...s, display_graph: graph}, [UpdateSimulation]])
            })
        }
    };

    nolib.no.runtime.add_listener('graphchange', 'update_hyperapp', listener);
    return () => nolib.no.runtime.remove_listener('graphchange', 'update_hyperapp');
}

const listen = (type, action) => [listenToEvent, {type, action}]

const listenToEvent = (dispatch, props) => {
    const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event.detail))

    requestAnimationFrame(() => addEventListener(props.type, listener));
    return () => removeEventListener(props.type, listener);
}

const run_h = ({dom_type, props, children, text}, exclude_tags=[]) => {
    dom_type = dom_type && dom_type._Proxy ? dom_type._value : dom_type;
    text = text && text._Proxy ? text._value : text;
    props = props && props._Proxy ? props._value : props;
    children = children && children._Proxy ? children._value : children;
    return dom_type === "text_value" 
        ? ha.text(text) 
        : ha.h(dom_type, props, children?.filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}

const result_subscription = (dispatch, {display_graph_id}) => {
    let animrun = false;
    const error_listener = (error) =>
        requestAnimationFrame(() => {
            dispatch(s => Object.assign({}, s, {error}))
        });

    const change_listener = graph => {
        if(graph.id === display_graph_id && !animrun) {
            cancelAnimationFrame(animrun)
            animrun = requestAnimationFrame(() => {
                dispatch(s => s.error ? Object.assign({}, s, {error: false}) : s)
                const result = hlib.runGraph(graph, graph.out, {edge: {node_id: graph.id + '/' + graph.out, as: "return"}});
                const display_fn = result => hlib.runGraph(graph, graph.out, {edge: {node_id: graph.id + '/' + graph.out, as: "display"}, result});
                const update_result_display_fn = display => result_display_dispatch(UpdateResultDisplay, {el: display && display.el ? display.el : {dom_type: 'div', props: {}, children: []}})
                const update_info_display_fn = () => dispatch(s => [s, s.selected[0] !== s.display_graph.out && [() => update_info_display({node_id: s.selected[0], graph_id: s.display_graph_id})]])
                const reset_animrun = () => animrun = false;
                const ap = (fn, v) => fn(v);
                const ap_promise = (p, fn) => p && typeof p['then'] === 'function' ? p.then(fn) : ap(fn, p);
                ap_promise(ap_promise(result, display_fn), update_result_display_fn);
                ap_promise(result, update_info_display_fn)
                ap_promise(result, reset_animrun)
            })
        }
    }

    nolib.no.runtime.add_listener('graphchange', 'clear_hyperapp_error', change_listener);
    nolib.no.runtime.add_listener('grapherror', 'update_hyperapp_error', error_listener);

    return () => (
        nolib.no.runtime.remove_listener('graphchange', 'clear_hyperapp_error', change_listener),
        nolib.no.runtime.remove_listener('grapherror', 'update_hyperapp_error', error_listener)
    );
}

const findViewBox = (nodes, links, selected, node_el_width, htmlid, dimensions) => {
    const visible_nodes = [];
    const visible_node_set = new Set();
    let selected_pos;
    links.forEach(l => {
        const el = document.getElementById(`link-${l.source.node_id}`);
        const info_el = document.getElementById(`edge-info-${l.source.node_id}`);
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

    const nodes_box = visible_nodes.reduce((acc, n) => ({min: {x: Math.min(acc.min.x, n.x - 24), y: Math.min(acc.min.y, n.y - 24)}, max: {x: Math.max(acc.max.x, n.x + node_el_width * 0.5 - 24), y: Math.max(acc.max.y, n.y + 24)}}), {min: {x: selected_pos ? (selected_pos.x - 96) : dimensions.x , y: selected_pos ? (selected_pos.y - 256) : dimensions.y}, max: {x: selected_pos ? (selected_pos.x + 96) : -dimensions.x, y: selected_pos ? (selected_pos.y + 128) : -dimensions.y}})
    const nodes_box_center = {x: (nodes_box.max.x + nodes_box.min.x) * 0.5, y: (nodes_box.max.y + nodes_box.min.y) * 0.5}; 
    const nodes_box_dimensions = {x: Math.max(dimensions.x * 0.5, Math.min(dimensions.x, (nodes_box.max.x - nodes_box.min.x))), y: Math.max(dimensions.y * 0.5, Math.min(dimensions.y, (nodes_box.max.y - nodes_box.min.y)))}
    const center = !selected_pos ? nodes_box_center : {x: (selected_pos.x + nodes_box_center.x * 3) * 0.25, y: (selected_pos.y + nodes_box_center.y * 3) * 0.25}

    return {nodes_box_dimensions, center};
}

const pzobj = {
    effect: function(dispatch, payload){
        if(!hlib.panzoom.instance || !payload.selected){ return; }
        this.lastpanzoom = performance.now();
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
            requestAnimationFrame(() => dispatch((s, p) => [ {...s, 
                show_all: false, 
            } 
        ]));
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
                    if(e.target.id.endsWith("-editor") && performance.now() - hlib.panzoom.lastpanzoom > 100){
                        dispatch(sub_payload.action, {event: 'panstart', transform: hlib.panzoom.instance.getTransform(), noautozoom: true}) 
                    }
                    return false;
                }
            });
            hlib.panzoom.instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
        });
        return () => { cancelAnimationFrame(init); hlib.panzoom.instance?.dispose(); }
    }
}

const UpdateSimulation = (dispatch, payload) => payload ? !(payload.simulation || payload.static) ? undefined : updateSimulationNodes(dispatch, payload) : dispatch(state => [state, [() => !(state.simulation || state.static) ? undefined : updateSimulationNodes(dispatch, state)]])

const UpdateGraphDisplay = (dispatch, payload) => requestAnimationFrame(() => dispatch(s => [{
    ...s,
    levels: calculateLevels(payload.nodes, payload.links, payload.display_graph, payload.selected)
}]))

const CustomDOMEvent = (_, payload) => document.getElementById(`${payload.html_id}`)?.dispatchEvent(new CustomEvent(payload.event, {detail: payload.detail}))

const create_randid = () => Math.random().toString(36).substring(2, 9);

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
}, 50);

const SetSelectedPositionStyleEffect = (_, {node, svg_offset, dimensions}) => {
    const rt = document.querySelector(':root');
    rt.style.setProperty('--nodex',  `${Math.min(node.x * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0) - 64, dimensions.x - 256)}px`);
    rt.style.setProperty('--nodey',  `${node.y * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0) + 32}px`);
}

const SelectNode = (state, {node_id, focus_property}) => [
    state.selected[0] === node_id ? state : {...state, selected: [node_id]},
    !state.show_all && [pzobj.effect, {...state, node_id: node_id}],
    [UpdateGraphDisplay, {...state, selected: [node_id]}],
    (state.show_all || state.selected[0] !== node_id) && [pzobj.effect, {...state, node_id}],
    focus_property && [FocusEffect, {selector: `.node-info input.${focus_property}`}],
    state.nodes.find(n => n.node_id === node_id) && [SetSelectedPositionStyleEffect, {node: state.nodes.find(n => n.node_id === node_id), svg_offset: pzobj.getTransform(), dimensions: state.dimensions}],
    node_id !== state.display_graph.out && [() => update_info_display({node_id, graph_id: state.display_graph_id})],
    state.selected[0] !== node_id && [() => nolib.no.runtime.publish("nodeselect", {data: node_id})]
]

const CreateNode = (state, {node, child, child_as, parent}) => [
    {
        ...state, 
        history: state.history.concat([{action: 'add_node', node, child, child_as}])
    },
    [dispatch => {
        nolib.no.runtime.add_node(state.display_graph, node)
        nolib.no.runtime.update_edges(state.display_graph, 
            parent 
                ? [{from: node.id, to: child, as: parent.as}, {from: parent.from, to: node.id, as: 'arg0'}] 
                : [{from: node.id, to: child, as: child_as}], 
            parent ? [{from: parent.from, to: child}] : []
        )
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
    [() => nolib.no.runtime.delete_node(state.display_graph, node_id)]
]

const ExpandContract = (state, {node_id}) => {
    const node = state.display_graph.nodes.find(n => n.id === node_id);
    const update = node.nodes 
            ? expand_node({node_id, display_graph: state.display_graph})
            : contract_node({node_id, display_graph: state.display_graph});
    
    return [
        state,
        [dispatch => {
            requestAnimationFrame(() => {
                // Have to be the same time so the right node is selected
                nolib.no.runtime.update_graph(update.display_graph);
                dispatch(SelectNode, {node_id: update.selected[0]})
            })
        }]
    ]
}

const CreateRef = (state, {node}) => [
    state,
    [dispatch => {
        const graph = {...base_graph(node), id: node.name, value: undefined};
        nolib.no.runtime.update_graph(graph);
        save_graph(graph);
        nolib.no.runtime.add_node(state.display_graph, {
            id: node.id,
            value: node.value,
            ref: node.name,
            name: undefined,
        });
    }]
]

const Copy = (state, {cut, as}) => {
    let edges_in;
    let queue = [...state.selected];
    const graph = {nodes: [], edges: []};
    while(queue.length > 0) {
        let node_id = queue.pop();
        graph.nodes.push({...nolib.no.runtime.get_node(state.display_graph, node_id)})
        edges_in = nolib.no.runtime.get_edges_in(state.display_graph, node_id);
        graph.edges = graph.edges.concat(edges_in);
        edges_in.forEach(e => queue.push(e.from));
    }

    return {...state, copied: {graph: graph, root: state.selected[0], as}};
}

const Paste = state => [
    {...state},
    [dispatch => {
        const node_id_map = {};
        state.copied.graph.nodes.forEach(n => {
            const new_id = create_randid();
            node_id_map[n.id] = new_id;
            nolib.no.runtime.add_node(state.display_graph, {...n, id: new_id})
        });
        nolib.no.runtime.update_edges(
            state.display_graph, 
            state.copied.graph.edges
                .map(e => ({...e, from: node_id_map[e.from], to: node_id_map[e.to]}))
                .concat([{from: node_id_map[state.copied.root], to: state.selected[0], as: state.copied.as}])
            );
        requestAnimationFrame(() => dispatch(SelectNode, {node_id: node_id_map[state.copied.root], focus_property: 'edge'}))
    }]
]

const StopPropagation = (state, payload) => [state, [() => payload.stopPropagation()]];

const save_graph = graph => {
    const graph_list = JSON.parse(localStorage.getItem('graph_list'))?.filter(l => l !== graph.id) ?? []; 
    graph_list.unshift(graph.id); 
    localStorage.setItem('graph_list', JSON.stringify(graph_list)); 
    const graphstr = JSON.stringify(base_graph(graph)); 
    localStorage.setItem(graph.id, graphstr); 
}

const SaveGraph = (dispatch, payload) => save_graph(payload.display_graph)

const ChangeDisplayGraphId = (dispatch, {id, select_out}) => {
    const json = localStorage.getItem(id);
    const graph = (json && base_graph(JSON.parse(json))) ?? nolib.no.runtime.get_graph(id) ?? nolib.no.runtime.get_ref(undefined, id)
    window.location.hash = '#' + id; 
    requestAnimationFrame(() =>
        dispatch(state => [
            {...state, display_graph_id: id},
            [dispatch => {
                requestAnimationFrame(() => {
                    const new_graph = graph || Object.assign({}, base_graph(state.display_graph), {id});
                    nolib.no.runtime.update_graph(new_graph);
                    nolib.no.runtime.remove_graph_listeners(state.display_graph_id);
                    dispatch(SelectNode, {node_id: new_graph.out})
                })
            }],
        ]))
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

const UpdateNode = (state, {node, property, value}) => [
    state,
    [() => nolib.no.runtime.add_node(
        state.display_graph, 
        Object.assign({}, 
            base_node(node ?? nolib.no.runtime.get_node(state.display_graph, state.selected[0])), 
            {[property]: value}
        ))
    ]
]

const UpdateEdge = (state, {edge, as}) => [
    state,
    [() => nolib.no.runtime.edit_edge(state.display_graph, {...edge, as}, edge)]
]

const OpenMenu = state => [{...state, menu: true}]

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
const node_el = ({html_id, selected, error, selected_distance, node}) =>ha.h('svg', {
    onclick: [SelectNode, {node_id: node.node_id}],  
    ontouchstart: [SelectNode, {node_id: node.node_id}], 
    width: '256', 
    height: '64', 
    key: html_id + '-' + node.node_id, 
    id: html_id + '-' + node.node_id, 
    class: {
        node: true, 
        selected: selected === node.node_id, 
        [`distance-${selected_distance < 4 ? selected_distance : 'far'}`]: true
    }
}, [
   ha.h(
        node.script ? 'rect' : node.ref && node.ref !== 'arg' ? 'rect' : node.nodes ? 'circle' : node.value ? 'polygon' : 'circle', 
        node.script 
            ? {class:{shape: true, script: true, error}, width: radius, height: radius, x: 10, y: 10} 
            : node.ref && node.ref !== 'arg' 
            ? {class: {shape: true, ref: true, error}, width: radius, height: radius, x: 10, y: 10} 
            : node.nodes 
            ? {class: {shape: true, graph: true, error}, r: radius * 0.5, cx: radius * 0.5 + 4, cy: radius * 0.5 + 4} 
            : node.value !== undefined 
            ? {class: {shape: true, value: true, error}, points: `4,${4 + radius} ${4 + radius},${4 + radius} ${4 + radius * 0.5},4`} 
            : {class: {shape: true, none: true, error}, r: radius * 0.5 , cx: radius * 0.5 + 4, cy: radius * 0.5 + 4}
    ),
    ha.memo(node_text_el, {
        node_id: node.id,
        primary: node.name ? node.name : node.value ? node.value : '', 
        focus_primary: node.name ? "name" : "value",
        secondary: node.ref ? node.ref : node.script ? 'script' : node.nodes ? `graph (${node.nested_node_count}, ${node.nested_edge_count})` : node.value !== undefined ? 'value' : 'object'
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

const input_el = ({label, property, value, onchange, options, inputs}) => ha.h(
    'div',
    {
        class: 'value-input', 
    },
    [
        ha.h('label', {for: `edit-text-${property}`}, [ha.text(label)]),
        ha.h('input', {
            class: property, 
            id: `edit-text-${property}`, 
            name: `edit-text-${property}`, 
            list: options && options.length > 0 ? 'edit-text-list' : undefined,
            oninput: (s, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: e.target.value})}], 
            onchange: (s, e) => [{...s, inputs: Object.assign(s.inputs, {[`edit-text-${property}`]: undefined})}, [dispatch => dispatch(onchange, e)]],
            onfocus: (state, event) => [{...state, focused: event.target.id}],
            onblur: (state, event) => [{...state, focused: false}],
            value: inputs[`edit-text-${property}`] ?? value
        }),
        options && options.length > 0 && ha.h('datalist', {id: 'edit-text-list'}, options.map(o => ha.h('option', {value: o}))) 
    ]
)

const info_el = ({node, hidden, links_in, link_out, display_graph_id, randid, refs, html_id, copied_graph, inputs, graph_out})=> {
    const node_ref = node.ref ? nolib.no.runtime.get_ref(display_graph_id, node.ref) : node;
    const description =  node_ref?.description;
    return ha.h('div', {id: "node-info-wrapper"}, [ha.h('div', {class: "spacer before"}, []), ha.h(
        'div',
        { 
            class: {'node-info': true, hidden}, 
            onfocusin: state => [{...state, editing: true}], 
            onblurout: state => [{...state, editing: false}] 
        },
        [
            ha.h('div', {class: "args"}, 
                [...new Set((node_ref?.extern 
                ? nolib.just.get.fn({}, nolib, node_ref.extern).args
                : node_ref?.nodes?.filter(n => n.ref === "arg" && n.type !== "internal").map(n => n.value) ?? [])
                    .filter(a => !a.includes('.') && !a.startsWith("_")))]
                    .concat(
                        ["arg" + ((links_in.filter(l => 
                                    l.as?.startsWith("arg")
                                    && new RegExp("[0-9]+").test(l.as.substring(3)))
                                .map(l => parseInt(l.as.substring(3))) ?? [])
                            .reduce((acc, i) => acc > i ? acc : i + 1, 0))])
                    .map(n => ha.h('span', {
                        class: "clickable", 
                        onclick: links_in.filter(l => l.as === n).map(l => [SelectNode, {node_id: l.source.node_id}])[0]
                            ?? [CreateNode, {node: {id: randid}, child: node.id, child_as: n}]
                    }, [ha.text(n)])) ?? []),
            ha.h('div', {class: "inputs"}, [
                input_el({
                    label: "value", 
                    value: node.value, 
                    property: "value", 
                    inputs,
                    onchange: (state, payload) => [UpdateNode, {node, property: "value", value: payload.target.value,
                }]}),
                input_el({
                    label: "name", 
                    value: node.name, 
                    property: "name", 
                    inputs,
                    onchange: (state, payload) => [
                        state,
                        [d => d(UpdateNode, {node, property: "name", value: payload.target.value})],
                        node.id === graph_out && [ChangeDisplayGraphId, {id: payload.target.value, select_out: true}]
                    ],
                    options: node.id === graph_out && JSON.parse(localStorage.getItem('graph_list'))
                }),
                input_el({
                    label: 'ref',
                    value: node.ref,
                    property: 'ref',
                    inputs,
                    options: refs,
                    onchange: (state, event) => [UpdateNode, {node, property: "ref", value: event.target.value}],
                }),
                link_out && link_out.source && input_el({
                    label: "edge", 
                    value: link_out.as, 
                    property: "edge",
                    inputs,
                    onchange: (state, payload) => [UpdateEdge, {edge: {from: link_out.from, to: link_out.to, as: link_out.as}, as: payload.target.value}]
                }),
            ]),
            description && ha.h('div', {class: "description"}, ha.text(description)),
            ha.h('div', {
                id: `${html_id}-code-editor`, 
                class: node.script || node.ref === "script" ? "visible" : "display-none",
            }, []),
            ha.h('canvas', {
                id: `${html_id}-info-canvas`,
                class: "display-none",
                key: "node-editor-info-canvas"
            }, []),
            ha.h('div', {id: `${html_id}-info-display`}),
            ha.h('div', {class: "buttons"}, [
                ha.h('div', {
                    class: "action", 
                    onclick: [ExpandContract, {node_id: node.node_id}]
                }, ha.text(node.nodes?.length > 0 ? "expand" : "contract")),
                node.nodes?.length > 0 && node.name !== '' && ha.h('div', {class: 'action', onclick: [CreateRef, {node}]}, ha.text("make ref")),
                ha.h('div', {
                    class: "action", 
                    onclick: [Copy, {cut: false, as: link_out.as}],
                    key: "copy-action"
                }, ha.text("copy")),
                copied_graph && ha.h('div', {
                    class: "action", 
                    onclick: [Paste],
                    key: "paste-action"
                }, ha.text("paste")),
                node.node_id == graph_out && ha.h('div', {
                    class: "action", 
                    onclick: (state, payload) => [state, [SaveGraph, state]]
                }, ha.text("save")),
                node.node_id !== graph_out && ha.h('div', {
                    class: "action", 
                    onclick: [DeleteNode, {
                        parent: link_out && link_out.source ? {from: link_out.source.node_id, to: link_out.target.node_id, as: link_out.as} : undefined, 
                        node_id: node.node_id
                    }]
                }, ha.text("delete"))
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

const update_info_display = ({node_id, graph_id}) => {
    const node = nolib.no.runtime.get_graph(graph_id + '/' + node_id) || nolib.no.runtime.get_node(graph_id, node_id);

    if (node.ref === "script" || node.script) {
        code_editor.dispatch({changes:{from: 0, to: code_editor.state.doc.length, insert: node.script ?? node.value}})
    }

    const node_ref = node && (node.ref && nolib.no.runtime.get_ref(graph_id, node.ref)) || node;
    const out_ref = node && (node.nodes && nolib.no.runtime.get_node(node, node.out)) || (node_ref.nodes && nolib.no.runtime.get_node(node_ref, node_ref.out));
    const node_display_el = (node.ref === "return" || (out_ref && out_ref.ref === "return")) 
        && hlib.runGraph(graph_id, node_id, Object.assign(
            {edge: {node_id: graph_id + "/" + node_id, as: "display"}}, 
            nolib.no.runtime.get_inputdata(node)
        ));
    info_display_dispatch && requestAnimationFrame(() => info_display_dispatch(UpdateResultDisplay, {el: node_display_el && node_display_el.el ? node_display_el.el : ha.h('div', {})}))
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
            return run_h(s.el);
        } catch(e) {
            return show_error(e, JSON.stringify(s.el));
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

let result_display_dispatch;
let info_display_dispatch;
let code_editor;

const init_code_editor = (dispatch, {html_id}) => {
    requestAnimationFrame(() => {
        // const state = EditorState.create({extensions: [basicSetup, javascript(), EditorView.theme({
        //     "&": {
        //         backgroundColor: "#282c34"
        //     }
        // }, {dark: true})]});
        const background = "#111";
        const highlightBackground = "#000";
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
                ".cm-activeLine": {
                    backgroundColor: highlightBackground,
                }
            }, {dark: true}),
            javascript(),
            EditorView.domEventHandlers({
                "blur": () => dispatch(UpdateNode, {property: "value", value: code_editor.state.doc.sliceString(0, code_editor.state.doc.length, "\n")})
            })
        ], parent: document.getElementById(`${html_id}-code-editor`)});
    })
}

const error_nodes = (error) => error instanceof AggregateError 
    ? error.errors.map(e => e instanceof nolib.no.NodysseusError ? e.node_id : false).filter(n => n) 
    : error instanceof nolib.no.NodysseusError 
    ? [error.node_id] : []; 
const dispatch = (init, _lib) => {
        // return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
    return ha.app({
    init: ()=> [init, 
        [() => requestAnimationFrame(() => {
            result_display_dispatch = result_display(init.html_id);
            info_display_dispatch = info_display(init.html_id);
            nolib.no.runtime.update_graph(init.display_graph)
        })],
        [UpdateSimulation, {...init, action: SimulationToHyperapp}],
        [init_code_editor, {html_id: init.html_id}]
    ],
    view: s =>ha.h('div', {id: s.html_id}, [
        ha.h('svg', {id: `${s.html_id}-editor`, width: s.dimensions.x, height: s.dimensions.y}, [
            ha.h('g', {id: `${s.html_id}-editor-panzoom`}, 
                [ha.memo(defs)].concat(
                    s.nodes?.map(node => ha.memo(node_el, ({
                        html_id: s.html_id, 
                        selected: s.selected[0], 
                        error: !!error_nodes(s.error).find(e => e.startsWith(s.display_graph.id + "/" + node.node_id)), 
                        selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(node.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(node.node_id),
                        node: Object.assign({}, node, nolib.no.runtime.get_node(s.display_graph, node.node_id))
                    }))) ?? []
                ).concat(
                    s.links?.map(link => ha.memo(link_el, {
                        link: Object.assign({}, link, nolib.no.runtime.get_edge(s.display_graph, link.source.node_id)),
                        selected_distance: s.show_all ? 0 : s.levels.distance_from_selected.get(link.source.node_id) > 3 ? 'far' : s.levels.distance_from_selected.get(link.source.node_id),
                    })) ?? []
                ).concat(
                    s.links?.filter(link => link.source.node_id == s.selected[0] || link.target.node_id === s.selected[0])
                        .map(link => insert_node_el({link, randid: s.randid, node_el_width: s.node_el_width}))
                )
            ),
        ]),
        info_el({
            node: Object.assign({}, s.nodes.find(n => n.node_id === s.selected[0]), nolib.no.runtime.get_node(s.display_graph, s.selected[0])),
            hidden: s.show_all,
            links_in: s.links.filter(l => l.target.node_id === s.selected[0]),
            link_out: Object.assign({}, s.links.find(l => l.source.node_id === s.selected[0]), nolib.no.runtime.get_edge(s.display_graph, s.selected[0])),
            display_graph_id: s.display_graph_id,
            randid: s.randid,
            refs: nolib.no.runtime.refs(),
            html_id: s.html_id,
            copied_graph: s.copied_graph,
            inputs: s.inputs,
            graph_out: s.display_graph.out
        }),
        search_el({search: s.search, _lib}),
        ha.h('div', {id: `${init.html_id}-result`}),
        s.error && ha.h('div', {id: 'node-editor-error'}, run_h(show_error(s.error, s.error.node_id)))
    ]),
    node: document.getElementById(init.html_id),
    subscriptions: s => [
        [d3subscription, {action: SimulationToHyperapp, update: UpdateSimulation}], 
        [graph_subscription, {display_graph_id: s.display_graph_id}],
        result_display_dispatch && [result_subscription, {display_graph_id: s.display_graph_id}],
        [keydownSubscription, {action: (state, payload) => {
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
                    //console.log(mode + ": " + key_input)
                    const result = hlib.runGraph(init.graph, "keybindings", {}, hlib)[mode][key_input];
                    switch(result){
                        case "up": {
                            const parent_edges = nolib.no.runtime.get_edges_in(state.display_graph, selected);
                            const node_id = parent_edges?.[Math.ceil(parent_edges.length / 2) - 1]?.from
                            action = node_id ? [SelectNode, {node_id}] : [state]
                            break;
                        }
                        case "down": {
                            const child_edge = state.display_graph.edges.find(e => e.from === selected);
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
                            action = [state => [{...state, show_all: true, focused: false, editing: false}]]
                            break;
                        }
                        default: {
                            if(result !== undefined) {
                                console.log(`Not implemented ${result}`)
                            }
                            nolib.no.runtime.publish(undefined, 'keydown', key_input)
                        }
                    }
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
                }
            ]
        }]
    ], 
});
}

const editor = async function(html_id, display_graph, lib, norun) {
    const simple = await resfetch("json/simple.json").then(r => r.json());
    const simple_html_hyperapp = await resfetch("json/simple_html_hyperapp.json").then(r => r.json());
    const editor_graph = await resfetch("json/editor.json").then(r => r.json());
    const url_params = new URLSearchParams(document.location.search);
    const examples = [simple_html_hyperapp, simple];
    const graph_list = JSON.parse(localStorage.getItem("graph_list")) ?? [];
    const hash_graph = window.location.hash.substring(1);
    if(!hash_graph && graph_list?.length > 0) {
        window.location.hash = graph_list[0]
    }
    let stored_graph = JSON.parse(localStorage.getItem(hash_graph ?? graph_list?.[0]));
    stored_graph = stored_graph ? base_graph(stored_graph) : undefined
    graph_list.map(id => localStorage.getItem(id)).filter(g => g).map(graph => nolib.no.runtime.update_graph(base_graph(JSON.parse(graph))))
    Promise.resolve(stored_graph ?? (hash_graph ? resfetch(`json/${hash_graph}.json`).then(r => r.status !== 200 ? simple : r.json()).catch(_ => simple) : simple))
        .then(display_graph => {

        const init = { 
            graph: editor_graph, 
            display_graph_id: display_graph.id,
            display_graph: display_graph,
            hash: window.location.hash ?? "",
            url_params,
            html_id,
            dimensions: {
                x: document.getElementById(html_id).clientWidth,
                y: document.getElementById(html_id).clientHeight
            },
            examples: examples,
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
            selected: [display_graph.out ?? "main/out"],
            inputs: {}
        };

        dispatch(init, lib)

    })
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
    const action = resolve(is_action_array_payload ? ha_action[0] : ha_action);
    const payload = resolve(is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {...ha_action.args, event: ha_payload} : ha_payload);

    return typeof action === 'object' && action.hasOwnProperty('fn') && action.hasOwnProperty('graph')
        ? dispatch((state, payload) => {
            try {
                const execute_graph_fn = nolib.no.executeGraphNode({graph: action.graph, lib: hlib})(action.fn);
                // Object.defineProperty(execute_graph_fn, 'name', {value: action.fn, writable: false});
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

const hlib = {
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
            const el = document.getElementById(id);
            const node = nodes.find(n => n.id === selected);
            const x = node.x;
            const y = node.y;
            const svg_offset = hlib.panzoom.getTransform();
            el.setAttribute("left",  `${Math.min(x * (svg_offset?.scale ?? 1) + (svg_offset?.x ?? 0) - 64, dimensions.x - 256)}px`);
            el.setAttribute("top", `${y * (svg_offset?.scale ?? 1) + (svg_offset?.y ?? 0) + 32}px`);
        }
    },
    panzoom: pzobj,
    runGraph: (graph, node, args) => nolib.no.runGraph(graph, node, args, {...hlib, ...nolib}),
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX }
}

export { editor, runGraph }