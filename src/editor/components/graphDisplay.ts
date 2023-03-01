import { ForceCenter, ForceCollide, ForceLink, ForceY } from "d3-force";
import * as ha from "hyperapp"
import { hashcode, nolib } from "../../nodysseus";
import { Graph, isNodeGraph, NodysseusNode } from "../../types";
import { wrapPromise } from "../../util";
import { HyperappState, NodysseusForceLink, NodysseusSimulation, d3Link, d3Node, Vector2 } from "../types";
import { calculateLevels, CreateNode, findViewBox, hlib, pzobj, SelectNode } from "../util";
import {KDTree} from "mnemonist";


export const UpdateSimulation: ha.Effecter<HyperappState, any>  = (dispatch, payload) => payload ? !(payload.simulation || payload.static) ? undefined : updateSimulationNodes(dispatch, payload) : dispatch(state => [state, [() => !(state.simulation) ? undefined : updateSimulationNodes(dispatch, state), undefined]])

export const UpdateGraphDisplay: ha.Effecter<HyperappState, any>  = (dispatch, payload) => {
    requestAnimationFrame(() => dispatch(s => [{
      ...s,
      levels: calculateLevels(payload.nodes, payload.links, payload.display_graph, payload.selected)
  }]))
}

export const updateSimulationNodes: ha.Effecter<HyperappState, {
  simulation?: NodysseusSimulation, 
  display_graph: Graph,
  clear_simulation_cache?: boolean
}> = (dispatch, data) => {
    const simulation_node_data = new Map<string, d3Node>();
    if(!data.clear_simulation_cache){
        data.simulation.nodes().forEach(n => {
            simulation_node_data.set(n.node_id, n)
        });
    }

    const start_sim_node_size = simulation_node_data.size;
    
    const simulation_link_data = new Map();
    if(!data.clear_simulation_cache){
        (data.simulation.force('links') as ForceLink<d3Node, d3Link>).links()
        .forEach(l => {
          if(typeof l.source === 'object' && typeof l.target === 'object') {
            simulation_link_data.set(`${idFromNode(l.source)}__${idFromNode(l.target)}`, l);
          }
        })
    }

    const start_sim_link_size = simulation_link_data.size;

    const main_node_map = new Map();

    const node_map = new Map(Object.entries(data.display_graph.nodes));
    const children_map = new Map(Object.values(data.display_graph.nodes).map(n => [n.id, 
        [nolib.no.runtime.get_edge_out(data.display_graph, n.id)?.to].filter(e => e)
    ]));

    const order = [];
    const queue = [data.display_graph.out ?? "out"];

    const parents_map = 
      wrapPromise(Promise.all(Object.values(data.display_graph.nodes)
        .map(n => 
          wrapPromise(nolib.no.runtime.get_edges_in(data.display_graph, n.id))
            .then(edges => [n.id, edges.map(e => e.from)]).value
        )))
      .then(kvs => new Map(kvs as Array<[string, Array<string>]>))
      .then(parents_map => {
        while(queue.length > 0) {
            const node = queue.shift();
            order.push(node);

            main_node_map.set(node, node);

            parents_map.get(node)?.forEach(p => {
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
        
        const ccw = ([ax, ay]: [number, number], [bx, by]: [number, number], [cx, cy]: [number, number]) => 
          (cy - ay) * (bx - ax) > (by - ay) * (cx - ax) ;

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
                id: n.id,
                node_id: n.id,
                hash: simulation_node_data.get(node_id)?.hash ?? hashcode(n.id),
                nested_node_count: isNodeGraph(n) ? Object.keys(n.nodes).length : undefined,
                nested_edge_count: isNodeGraph(n) ? Object.keys(n.edges).length : undefined,
                x: Math.floor(simulation_node_data.get(node_id)?.x 
                    ?? simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.x
                    ?? Math.floor(window.innerWidth * (randpos.x * .5 + .25))),
                y: Math.floor(simulation_node_data.get(node_id)?.y 
                    ?? addorundefined(simulation_node_data.get(main_node_map.get(parents_map.get(n.id)?.[0]))?.y, 128)
                    ?? Math.floor(window.innerHeight * (randpos.y * .5 + .25)))
            }] : children.map((c, i) => ({
                id: n.id,
                node_id: n.id,
                hash: simulation_node_data.get(node_id)?.hash ?? hashcode(n.id),
                sibling_index_normalized: parents_map.get(c).findIndex(p => p === n.id) / parents_map.get(c).length,
                nested_node_count: isNodeGraph(n) ? Object.keys(n.nodes).length : undefined,
                nested_edge_count: isNodeGraph(n) ? Object.keys(n.edges).length : undefined,
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

            const simnode = calculated_nodes[0];
            const A: [number, number] = [simnode.x, simnode.y];
            children.forEach(child => {
              const cnode = simulation_node_data.get(child);
              const B: [number, number] = [cnode.x, cnode.y];
              for(let compnode of simulation_node_data.values()) {
                if(compnode && compnode.id !== nid && compnode.id !== child) {
                  const C: [number, number] = [compnode.x, compnode.y];
                  for(let compp of parents_map.get(compnode.id)) {
                    const comppnode = simulation_node_data.get(compp);
                    if(comppnode) {
                      const D: [number, number] = [comppnode.x, comppnode.y];

                      if(ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)) {
                        simnode.x += (comppnode.x - simnode.x) * 2;
                      }
                    }
                  }
                }
              }
            })

            calculated_nodes.map(n => simulation_node_data.set(n.node_id, n));

            return calculated_nodes;
        })

        const links = Object.values(data.display_graph.edges)
            .filter(e => main_node_map.has(e.from) && main_node_map.has(e.to))
            .map(e => {
                const l = simulation_link_data.get(`${e.from}__${e.to}`);
                const proximal = (
                    (parents_map.get(main_node_map.get(e.to))?.length ?? 0) + 
                    (parents_map.get(children_map.get(main_node_map.get(e.to))[0])?.length ?? 0)
                ) * 0.5;
                return {
                    ...e,
                    edge: e,
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
                (data.simulation.force('links') as ForceLink<d3Node, d3Link>)?.links().length !== links.length) {
                data.simulation.alpha(0.8);
            }

            data.simulation.nodes(nodes);
            (data.simulation.force('links') as ForceLink<d3Node, d3Link>).links(links);
            // data.simulation.force('fuse_links').links(data.fuse_links);
        }

        const parentlengths = [...parents_map.values()].map(c => c.length).filter(l => l > 0);
        const maxparents = Math.max(...parentlengths);
        const avgparents = parentlengths.reduce((acc, v) => acc + v, 0) / nodes.length;
        const logmaxparents = maxparents === 1 ? nodes.length : Math.log(nodes.length) / Math.log(1 + avgparents);

        (data.simulation.force('link_direction') as ForceY<d3Node>)
            .y(n =>
                (((parents_map.get(n.node_id)?.length > 0 ? 1 : 0)
                    + (children_map.get(n.node_id)?.length > 0 ? -1 : 0)
                    // + (parents_map.get(children_map.get(main_node_map.get(n.to))[0])?.length ?? 0)
                    + (children_map.get(n.node_id)?.length > 0 ? -1 : 0))
                    * (logmaxparents + 3) + .5) * window.innerHeight)
            .strength(n => (!!parents_map.get(n.node_id)?.length === !children_map.get(n.node_id)?.length)
                || children_map.get(n.node_id)?.length > 0 ? .01 : 0);


        (data.simulation.force('collide') as ForceCollide<d3Node>).radius(96);
    // data.simulation.force('center').strength(n => (levels.parents_map.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children_map.get(n.node_id)?.length ?? 0) * 0.25)
    })
}

const idFromNode = (node: d3Node | string | number): string => typeof node === "object" ? node.node_id : typeof node === "number" ? node.toFixed() : node;

// Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
// This is probably doing too much.
export const d3subscription = (dispatch, props) => {
  console.log("d3 called again")
    const simulation: NodysseusSimulation = hlib.d3.forceSimulation<d3Node>()
        .force('charge', hlib.d3.forceManyBody().strength(-1024).distanceMax(1024).distanceMin(64))
        .force('collide', hlib.d3.forceCollide(64))
        .force('links', hlib.d3
            .forceLink([])
            .distance(l => l.distance ?? 128)
            .strength(l => l.strength)
            .id((n: d3Node) => n.node_id))
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
    let show_all = false;
    let selectedOffset: false | {x: number, y: number} = false;
    const node_el_width = 256;
    const centerObjectFn = center => obj => ({ ...obj, x: Math.floor(obj.x - center.x), y: Math.floor(obj.y - center.y) })
    const calcBoundingRect = nodes => {
      const rect = nodes.reduce(
            (rect, node) => {
              rect.x0 = Math.min(rect.x0, node.x);
              rect.y0 = Math.min(rect.y0, node.y);
              rect.x1 = Math.max(rect.x1, node.x);
              rect.y1 = Math.max(rect.y1, node.y);
              return rect;
            }
          , {x0: Number.MAX_VALUE, y0: Number.MAX_VALUE, x1: Number.MIN_VALUE, y1: Number.MIN_VALUE});
      const center = {x: (rect.x1 + rect.x0) * 0.5, y: (rect.y1 + rect.y0) * 0.5};
      return {rect, center}
    }
    let initBounding: Vector2 | false = false;
    let lastAlpha;
    let currentSelectedOffset: false | Vector2;

    const tick = () => {
        if(simulation.nodes().length === 0) {
            requestAnimationFrame(() => dispatch(s => [(htmlid = s.html_id, {...s, simulation}), [props.update, s]]));
        }
        let isReset = simulation.alpha() > lastAlpha;
        lastAlpha = simulation.alpha();

        currentSelectedOffset = isReset || selected !== pzobj.centered ? false : (currentSelectedOffset ?? selectedOffset);

        if (simulation.alpha() > simulation.alphaMin()) {
          currentSelectedOffset = selectedOffset;

          if(simulation.nodes().length > 0 && selected === pzobj.centered && (initBounding === false || isReset)) {
            initBounding = calcBoundingRect(simulation.nodes()).center;
            simulation.nodes().forEach(n => {
              if(n.node_id === selected && initBounding) {
                selectedOffset = {x: n.x - initBounding.x, y: n.y - initBounding.y}
              }
            })
          }

          const boundingRect = calcBoundingRect(simulation.nodes())
          if(selected === pzobj.centered && initBounding) {
            simulation.nodes().forEach(n => {
              if(n.node_id === selected && initBounding) {
                currentSelectedOffset = {x: n.x - boundingRect.center.x, y: n.y - boundingRect.center.y}
              }
            })
          }

          const centerObject = obj => ({
            ...obj,
            x: obj.x - (initBounding ? (boundingRect.center.x - initBounding.x) : 0) - (currentSelectedOffset && selectedOffset ? currentSelectedOffset.x - selectedOffset.x : 0),
            y: obj.y - (initBounding ? (boundingRect.center.y - initBounding.y) : 0) - (currentSelectedOffset && selectedOffset ? currentSelectedOffset.y - selectedOffset.y : 0)
          });
            const data = {
                nodes: simulation.nodes().map(centerObject),
                links: (simulation.force('links') as ForceLink<d3Node, d3Link>).links().map(l => ({
                    ...l,
                    as: l.edge.as,
                    source: centerObject({
                        node_id: idFromNode(l.source),
                        x: (l.source as d3Node).x,
                        y: (l.source as d3Node).y
                    }),
                    target: centerObject({
                        node_id: idFromNode(l.target),
                        x: (l.target as d3Node).x,
                        y: (l.target as d3Node).y
                    })
                }))};
            const ids = simulation.nodes().map(n => n.node_id).join(',');
            stopped = false;
            simulation.tick();
            dispatch([s => (
              selected = s.selected[0],
              show_all = s.show_all,
              s.nodes.map(n => n.node_id).join(',') !== ids 
                ? [props.action, data] 
                : s.stopped 
                  ? [{...s, stopped}, 
                        !s.noautozoom && [
                            hlib.panzoom.effect, {
                                ...s, 
                                nodes: data.nodes.map(n => ({...n, x: n.x - 8, y: n.y})), 
                                links: data.links,
                                prevent_dispatch: true, 
                                node_id: s.selected[0]
                            }
                        ]
                  ]
                  : s
            )]);

            const visible_nodes = [];
            const visible_node_set = new Set();

            simulation.nodes().map(centerObject).map(n => {
                const el = document.getElementById(`${htmlid}-${n.node_id.replaceAll("/", "_")}`);
                if(el) {
                    const x = n.x - node_el_width * 0.5;
                    const y = n.y ;

                    el.style.setProperty('--tx', `${(x - 20).toFixed()}px`);
                    el.style.setProperty('--ty', `${(y - 20).toFixed()}px`);
                    // el.setAttribute('transform', `translate(${(x - 20).toFixed()}px, ${(y - 20).toFixed()}px)`)

                    if(n.node_id === selected) {
                        visible_nodes.push({x, y})
                        // selectedPos = {x, y};
                    }
                }
            });

            (simulation.force('links') as NodysseusForceLink).links().map(l => {
                const el = document.getElementById(`link-${idFromNode(idFromNode(l.source))}`);
                const edge_label_el = document.getElementById(`edge-info-${idFromNode(l.source)}`);
                const insert_el = document.getElementById(`insert-${idFromNode(l.source)}`);
                if(el && edge_label_el) {
                    const source = centerObject({x: (l.source as d3Node).x - node_el_width * 0.5, y: (l.source as d3Node).y});
                    const target = centerObject({x: (l.target as d3Node).x - node_el_width * 0.5, y: (l.target as d3Node).y});
                    const length_x = Math.abs(source.x - target.x); 
                    const length_y = Math.abs(source.y - target.y); 
                    const length = Math.sqrt(length_x * length_x + length_y * length_y); 
                    const lerp_length = 24;
                    // return {selected_distance, selected_edge, source: {...source, x: source.x + (target.x - source.x) * lerp_length / length, y: source.y + (target.y - source.y) * lerp_length / length}, target: {...target, x: source.x + (target.x - source.x) * (1 - (lerp_length / length)), y: source.y + (target.y - source.y) * (1 - (lerp_length / length))}}"
                    el.setAttribute('x1', Math.floor(source.x + (target.x - source.x) * lerp_length / length).toFixed());
                    el.setAttribute('y1', Math.floor(source.y + (target.y - source.y) * lerp_length / length).toFixed());
                    el.setAttribute('x2', Math.floor(source.x + (target.x - source.x) * (1 - lerp_length / length)).toFixed());
                    el.setAttribute('y2', Math.floor(source.y + (target.y - source.y) * (1 - lerp_length / length)).toFixed());
                    // edge_label_el.setAttribute('transform', `translate(${((target.x - source.x) * edge_label_dist + source.x + 16).toFixed()}, ${((target.y - source.y) * edge_label_dist + source.y).toFixed()})`);

                    const min_edge_label_dist = 32 / Math.abs(target.y - source.y);
                    const max_edge_label_dist = Math.min(64 / Math.abs(target.y - source.y), 0.5);
                    const edge_label_dist = Math.min(max_edge_label_dist, Math.max(min_edge_label_dist, 0.125));

                    edge_label_el.setAttribute('x', ((target.x - source.x) * edge_label_dist + source.x + 16).toFixed())
                    edge_label_el.setAttribute('y', ((target.y - source.y) * edge_label_dist + source.y).toFixed());

                    if(insert_el) {
                        insert_el.setAttribute('x', (Math.floor((source.x + target.x) * 0.5 - 16)).toFixed())
                        insert_el.setAttribute('y', (Math.floor((source.y + target.y) * 0.5 - 16)).toFixed())
                    }

                    if (idFromNode(l.source) === selected) {
                        visible_nodes.push({x: target.x, y: target.y});
                        visible_node_set.add(idFromNode(l.target));
                    } else if (idFromNode(l.target) === selected) {
                        visible_nodes.push({x: source.x, y: source.y});
                        visible_node_set.add(idFromNode(l.source));
                    }
                }
            });

            // iterate again to get grandparents
            (simulation.force('links') as NodysseusForceLink).links().map(l => {
                if(visible_node_set.has(idFromNode(l.target)) && !visible_node_set.has(idFromNode(l.source))) {
                    const source = {x: (l.source as d3Node).x - node_el_width * 0.5, y: (l.source as d3Node).y};
                    visible_nodes.push({x: source.x, y: source.y});
                }
            })
        } else if(!stopped) {
          const boundingRect = calcBoundingRect(simulation.nodes())
          if(selected === pzobj.centered && initBounding) {
            simulation.nodes().forEach(n => {
              if(n.node_id === selected && initBounding) {
                currentSelectedOffset = {x: n.x - boundingRect.center.x, y: n.y - boundingRect.center.y}
              }
            })
          }
          const centerObject = centerObjectFn({
            x: (initBounding ? (boundingRect.center.x - initBounding.x) : 0) + (currentSelectedOffset && selectedOffset ? currentSelectedOffset.x - selectedOffset.x : 0),
            y: (initBounding ? (boundingRect.center.y - initBounding.y) : 0) + (currentSelectedOffset && selectedOffset ? currentSelectedOffset.y - selectedOffset.y : 0)
          });
            const data = {
                nodes: simulation.nodes().map(n => {
                    return centerObject({ ...n, x: ( Math.floor(n.x)), y: Math.floor(n.y) })
                }),
                links: (simulation.force('links') as NodysseusForceLink).links().map(l => ({
                    ...l,
                    as: l.edge.as,
                    source: centerObject({
                        node_id: idFromNode(l.source),
                        x: Math.floor((l.source as d3Node).x),
                        y: Math.floor((l.source as d3Node).y)
                    }),
                    target: centerObject({
                        node_id: idFromNode(l.target),
                        x: Math.floor((l.target as d3Node).x),
                        y: Math.floor((l.target as d3Node).y)
                    })
                }))};
            stopped = true; 
            requestAnimationFrame(() => {
              initBounding = false;
                dispatch([props.action, data])
                dispatch(s => [{...s, noautozoom: false, stopped}])
                // dispatch(s => [{...s, noautozoom: false, stopped}, !s.noautozoom && [hlib.panzoom.effect, {...s, node_id: s.selected[0]}]])
            });
        }

        if (!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);

    return () => { abort_signal.stop = true; }
}

const fill_rect_el = () =>ha.h('rect', {class: 'fill', width: '48', 'height': '48'}, [])
const node_text_el = ({node_id, primary, focus_primary, secondary}) =>ha.h('text', {x: 48, y: 12}, [
   ha.h('tspan', {class: "primary", dy: ".6em", x: "48", onpointerdown: [SelectNode, {node_id, focus_property: focus_primary}]}, ha.text(primary.substring(0, 24))),
   ha.h('tspan', {class: "secondary",  dy: "1.2em", x: "48", onpointerdown: [SelectNode, {node_id, focus_property: "ref"}]}, ha.text(secondary.substring(0, 24)))
])


const radius = 24;
export const node_el = ({html_id, selected, error, selected_distance, node_id, node_ref, node_name, node_value, has_nodes, nested_edge_count, nested_node_count}) =>ha.h('g', {
    onpointerdown: [SelectNode, {node_id}],  
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
   ha.h<HyperappState, any>(
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
    ha.memo(fill_rect_el, {})
])

export const link_el = ({link, selected_distance}) =>ha.h('g', {}, [
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

export const insert_node_el = ({link, randid, node_el_width}) => ha.h('svg', {
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
