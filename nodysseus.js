import DEFAULT_GRAPH from "./pull.json"
import _ from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

const executeGraph = ({state, graph}) => {
    const out = graph.out;

    let state_length = 0;
    let active_nodes_length = 0;

    let skip_stuck_test = false;

    const active_nodes = new Map([[ out, Object.assign({}, graph.nodes.find(n => n.id === out), {
        inputs: graph.edges.filter(e => e.to === out),
        _nodeflag: true
    })]]);


    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    while(!state.has(out)) {

        if(!skip_stuck_test && state_length === state.size && active_nodes_length === active_nodes.size) {
            console.log(graph);
            console.log(state);
            console.log(active_nodes);
            throw new Error(`stuck with active: ${[...active_nodes.keys()].join(', ')} and state: ${[...state.keys()].join(', ')}`);
        }

        skip_stuck_test = false;

        state_length = state.size;
        active_nodes_length = active_nodes.size;

        let input;
        let node;

        for(node of active_nodes.values()) {
            let run = true;
            let has_inputs = true;

            let inputs = node.inputs;

            // edge types
            //   ref gets the node id
            //   concat puts all the data as the "as" attribute
            //   inputs defines the expected inputs
            //   data (default)

            for(let i = 0; i < node.inputs.length; i++) {
                input = node.inputs[i];

                if (input.type === "inputs") {
                    has_inputs = state.has(input.from);
                    if(has_inputs) {
                        const def_inputs = state.get(input.from);
                        inputs = node.inputs.filter(node_input => def_inputs.includes(node_input.as));
                    } else {
                        inputs = [input];
                    }
                }
            }

            for(let i = 0; i < inputs.length; i++) {
                input = inputs[i];
                if(input?.type !== "ref" && !state.has(input.from)){
                    if(!active_nodes.has(input.from)) {
                        const input_node = node_map.get(input.from);

                        if(input_node === undefined) {
                            throw new Error(`Can't find input ${input.from} for node ${node.id}`);
                        }

                        active_nodes.set(input.from, Object.assign({}, input_node, {
                            inputs: graph.edges.filter(e => e.to === input.from),
                            _nodeflag: true
                        }));
                    }

                    run = false;
                }
            }

            const type = node.type?.node_type ?? typeof node.type === 'string' ? node.type : undefined;

            if(node.value === undefined && type && !state.has(type)) {
                if(!active_nodes.has(type)) {
                    active_nodes.set(type, Object.assign({}, node_map.get(type), {
                        inputs: graph.edges.filter(e => e.to === type),
                        _nodetypeflag: true,
                        _nodeflag: true
                    }))
                }

                run = false;
            }

            if (run) {
                let datas = [{}];
                if (node.value !== undefined) {
                    state.set(node.id, [node.value].flat(1));
                    active_nodes.delete(node.id);
                } else {
                    inputs.sort((a, b) =>
                        a.as && !b.as
                        ? 1
                        : !a.as && b.as
                        ? -1
                        : a.order !== undefined && b.order !== undefined
                        ? a.order - b.order 
                        : a.order !== undefined
                        ? a.order
                        : b.order !== undefined
                        ? b.order
                        : a.type === undefined && b.type === undefined
                        ? state.get(a.from).length - state.get(b.from).length // order the ones with less up front
                        : 0
                    );


                    let input;
                    const input_results = [];
                    for(let i = 0; i < inputs.length; i++) {
                        input = inputs[i];
                        if(datas.length === 0) {
                            break;
                        } else if(input?.type === "concat") {
                            input_results.push(state.get(input.from));
                            if(state.get(input.from).length > 0 || datas[0][input.as] === undefined) {
                                datas.forEach(d => Object.assign(d, {[input.as]: state.get(input.from)}))
                            }
                        } else if (input?.type === "ref") {
                            input_results.push(input.from);
                            datas.forEach(d => Object.assign(d, {[input.as]: input.from}))
                        } else if (state.get(input.from).length > 1 && datas.length > 1) {
                            input_results.push(state.get(input.from));
                            state.get(input.from).forEach((d, i) =>{
                                datas[i] = Object.assign(datas.length > i ? datas[i] : {}, input.as ? {[input.as]: d} : d);
                            });
                        } else if (state.get(input.from).length > 0) {
                            const new_datas = []
                            const state_datas = state.get(input.from);
                            input_results.push(state_datas);
                            for(let i = 0; i < datas.length; i++) {
                                for(let j = 0; j < state_datas.length; j++) {
                                    new_datas.push(input.as 
                                        ? Object.assign({}, datas[i], {[input.as]: state_datas[j]})
                                        : Object.assign({}, datas[i], state_datas[j]));
                                }
                            }

                            datas = new_datas;
                        }
                    }

                    const node_type = type
                        ? Object.assign({}, state.get(type)[0], node,{args: (node.args ?? []).concat(state.get(type)[0].args ?? [])}, {_nodetypeflag: false})
                        : node;

                    if(node._nodetypeflag) {
                        state.set(node.id, node.nodes ? [{nodes: node.nodes, edges: node.edges, in: node.in, out: node.out}] : [{args: node.args, script: node.script, value: node.value}])
                        active_nodes.delete(node.id);
                    } else if (node_type.nodes && node_type.edges){
                        if(!state.has(node.id + "/" + (node_type.in ?? 'in'))) {
                            state.set(node.id + "/" + (node_type.in ?? 'in'), datas);
                        }

                        active_nodes.set(node.id, {
                            id: node.id, 
                            args: ["value"],
                            inputs:[{from: `${node.id}/${node_type.out ?? 'out'}`, to: node.id, as: 'value'}], 
                            _nodeflag: true, 
                            script: "return [value]"
                        })

                        skip_stuck_test = true; // active_nodes[node_id] changed but the size didn't

                        if(!node_map.has(`${node.id}/${node_type.out ?? 'out'}`)) {
                            for(const child of node_type.nodes){
                                const new_node = Object.assign({}, child);
                                new_node.id = `${node.id}/${child.id}`;
                                graph.nodes.push(new_node)
                                node_map.set(new_node.id, new_node);
                            }

                            for(let i = 0; i < node_type.edges.length; i++){
                                const new_edge = Object.assign({}, node_type.edges[i]);
                                new_edge.from =  `${node.id}/${new_edge.from}`;
                                new_edge.to =  `${node.id}/${new_edge.to}`;
                                graph.edges.push(new_edge);
                            }
                        }
                    } else if(node_type.script) {
                        try {
                            const args = new Map([['lib', lib], ['node', node], ['inputs', input_results]]);
                            node.inputs.forEach(i => {
                                if(i.as && !keywords.has(i.as) && !args.has(i.as)) {
                                    args.set(i.as, null)
                                }
                            });
                            if (node_type.args){
                                node_type.args.forEach(a => {
                                    if(a && !keywords.has(a) && !args.has(a)) {
                                        args.set(a, null)
                                    }
                                });
                            }

                            // order matters
                            // the function bs is for debugging purposes
                            const fn = new Function(`return function _${(node.name ?? node.id).replace(/(\s|\/)/g, '_')}(${[...args.keys()].join(',')}){${node_type.script}}`)()
                            const state_datas = []
                            for(let i = 0; i < datas.length; i++) {
                                // order matters because of the above
                                node.inputs.forEach(input => {
                                    if(input.as && !keywords.has(input.as)) {
                                        args.set(input.as, datas[i][input.as]);
                                    }
                                });

                                if (node_type.args){
                                    node_type.args.forEach(arg => {
                                        if(!keywords.has(arg)) {
                                            args.set(arg, datas[i][arg]);
                                        }
                                    })
                                }

                                const results = fn.apply(null, [...args.values()]);
                                Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
                            }
                            state.set(node.id, state_datas);
                            active_nodes.delete(node.id);
                        } catch (e) {
                            console.log(`error in node`);
                            console.error(e);
                            console.dir(node_type);
                            console.log(state);
                            throw new AggregateError([Error(`Error in node ${node_type.name ?? node_type.id}`)].concat(e instanceof AggregateError ? e.errors : [e]));
                        }
                    } else {
                        state.set(node.id, datas);
                        active_nodes.delete(node.id);
                    }
                }
            }
        }
    }

    return state;
};

const test_graph = { 
    "in": "in", 
    "out": "out", 
    "nodes": [
        { 
            "id": "out", 
            "args": ["value"], 
            "script": "return value;" 
        }, 
        { "id": "in"}
    ], 
    "edges": [
        {"from": "in", "to": "out"}
    ]
}

//////////
// TODO: convert these to nodes

const calculateLevels = (graph, selected, fixed_vertices) => {
    const find_childest = n => {
        const e = graph.edges.find(e => e.from === n);
        if(e) {
            return find_childest(e.to);
        } else {
            return n;
        }
    }
    const top = find_childest(selected);

    const levels = new Map();
    bfs(graph, levels)(top, 0);

    const parents = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id).map(e => e.from)]));
    const children = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.from === n.id).map(e => e.to)]));
    const siblings = new Map(graph.nodes.map(n => [n.id, [...(new Set(/*parents.get(n.id)?.flatMap(p => children.get(p)?.filter(c => c !== n.id) ?? []).concat(*/children.get(n.id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values()/*)*/]]))
    const distance_from_selected = new Map();

    const connected_vertices = new Map(!fixed_vertices ? [] : fixed_vertices.nodes.flatMap(v => (v.nodes ?? []).map(n => [n, v.nodes])));

    const calculate_selected_graph = (s, i) => {
        if(distance_from_selected.get(s) <= i) {
            return;
        }

        distance_from_selected.set(s, i);
        parents.get(s)?.forEach(p => { calculate_selected_graph(p, i + 1); });
        children.get(s)?.forEach(c => { calculate_selected_graph(c, i + 1); });
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
        connected_vertices
    }
}

const bfs = (graph, visited) => (id, level) => {
    if (visited.has(id) && visited.get(id) >= level) {
        return;
    }

    visited.set(id, level);

    const next = bfs(graph, visited);

    for(const e of graph.edges) {
        if(e.to === id) {
            next(e.from, level + 1);
        }
    }
}

const d3simulation = () => {
    const simulation =
        lib.d3.forceSimulation()
        .force('charge', lib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(128))
        .force('collide', lib.d3.forceCollide(64))
        .force('links', lib.d3
            .forceLink([])
            .distance(128)
            .strength(l => l.strength)
            .id(n => n.node_id))
        .force('link_direction', lib.d3.forceY().strength(.1))
        .force('center', lib.d3.forceCenter())
        // .force('link_siblings', lib.d3.forceX().strength(1))
        // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
        // .velocityDecay(0.7)
        .alphaMin(.1);

    return { simulation };
}

const updateSimulationNodes = (data) => {
    const selected = data.selected[0];
    const levels = data.levels ?? calculateLevels(data.display_graph, data.display_graph.out);
    const selected_level = levels.level_by_node.get(selected);

    if(typeof(data.links?.[0]?.source) === "string") {
        if(
            data.simulation.nodes()?.length !== data.nodes.length || 
            data.simulation.force('links')?.links().length !== data.links.length) {
            data.simulation.alpha(0.4);
        }


        data.simulation.nodes(data.nodes);
        data.simulation.force('links').links(data.links);
        // data.simulation.force('fuse_links').links(data.fuse_links);
    }


    const sibling_x = new Map();
    const selected_x =  ((levels.nodes_by_level[selected_level].findIndex(l => l === selected) + 1) 
                / (levels.nodes_by_level[selected_level].length + 1));


    // data.nodes.forEach(n => {
    //     sibling_x.set(n.node_id, 
    //         (data.show_all ? 0.5 
    //             :levels.level_by_node.has(n.node_id)
    //         ?  (((levels.nodes_by_level[levels.level_by_node.get(n.node_id)].findIndex(l => l === n.node_id) + 1) 
    //             / (levels.nodes_by_level[levels.level_by_node.get(n.node_id)].length + 1)) - selected_x) 
    //             / (Math.min(3, levels.distance_from_selected.get(n.node_id)) * 0.25 + 1) + 0.5
    //         : .75)
    //             * window.innerWidth
    //     );
    // })

    // data.simulation.force('link_siblings').x((n) => sibling_x.get(n.node_id));

    // data.simulation.force('charge')
    //     // .strength(n => data.show_all ? -128 : levels.distance_from_selected.has(n.node_id) ? -64 : -8)
    //     .strength(n => -128);

    // data.simulation.force('link_direction')
    //     .y((n) => window.innerHeight * (
    //         data.show_all ? 0.5 
    //         : selected === n.node_id
    //         ? 0.5 
    //         : levels.level_by_node.has(n.node_id) && selected_level !== undefined
    //         ?  .5 + (selected_level === levels.level_by_node.get(n.node_id) 
    //             ? 0 
    //             : 0.25 * ((1 - Math.pow(0.5, Math.abs(selected_level - levels.level_by_node.get(n.node_id))))/(1 - 0.5)) // sum geometric series
    //             ) * Math.sign(selected_level - levels.level_by_node.get(n.node_id))
    //         : .9
    //     ));
    data.simulation.force('link_direction')
        .y(n => 
        (((levels.parents.get(n.node_id)?.length > 0 ? 1 : 0) + (levels.children.get(n.node_id)?.length > 0 ? -1 : 0)) * 2 + .5) * window.innerHeight)
        .strength(n => (!!levels.parents.get(n.node_id)?.length === !levels.children.get(n.node_id)?.length) ? .1 : 0);


    data.simulation.force('collide').radius(64);
    // data.simulation.force('center').strength(n => (levels.parents.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children.get(n.node_id)?.length ?? 0) * 0.25)

    // console.log(data.links)

}

const graphToSimulationNodes = (data) => {
    const simulation_node_data = new Map();
    data.nodes.forEach(n => {
        simulation_node_data.set(n.node_id, n)
    });

    const nodes = data.display_graph.nodes.map(n => {
        const current_data = simulation_node_data.get(n.id);
        return {
            node_id: n.id,
            type: n.type,
            nodes: n.nodes,
            edges: n.edges,
            script: n.script,
            value: n.value,
            name: n.name,
            in: n.in,
            out: n.out,
            level: data.levels.level_by_node.get(n.id),
            selected_distance: data.levels.distance_from_selected.get(n.id),
            x: current_data?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25)),
            y: current_data?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25))
        };
    })


    const links = data.display_graph.edges
        .filter(e => e.to !== "log" && e.to !=="debug")
        .map(e => ({
            source: e.from, 
            target: e.to, 
            as: e.as, 
            type: e.type, 
            strength:  Math.abs(data.levels.level_by_node.get(e.to) - data.levels.level_by_node.get(e.from)) === 1 ? 4 : 1,
            selected_distance: data.levels.distance_from_selected.get(e.to) !== undefined ? Math.min(data.levels.distance_from_selected.get(e.to), data.levels.distance_from_selected.get(e.from)) : undefined,
            sibling_index_normalized: (data.levels.siblings.get(e.from).findIndex(n => n === e.from) + 1) / (data.levels.siblings.get(e.from).length + 1),
        }));

    const fuse_links =  !data.levels.connected_vertices ? [] : data.display_graph.nodes.flatMap(n1 => 
            data.display_graph.nodes
                .filter(n2 => n2.id != n1.id && !data.levels.connected_vertices.get(n1.id)?.includes(n2.id))
                .map(n2 => ({
                    source: n1.id,
                    target: n2.id,
                })));
            
    return {
        nodes,
        links,
        fuse_links
    }
}

const d3subscription = simulation => dispatch => { 
    const abort_signal = {stop: false};
    simulation.stop();
    const tick = () => {
        if(simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
            dispatch(s => ({ 
                ...s, 
                nodes: simulation.nodes().map(n => ({...n, x: Math.floor(n.x), y: Math.floor(n.y)})), 
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
                })),
                fuse_links: [] /*simulation.force('fuse_links').links().map(l => ({
                    ...l,
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
                }))*/
            }));
        }

        if(!abort_signal.stop) {
            requestAnimationFrame(tick);
        }
    };
    
    requestAnimationFrame(tick);

    return () => { abort_signal.stop = true; }
}

const keydownSubscription = (dispatch, options) => { 
    const handler = ev => { 
        if(ev.key === "s" && ev.ctrlKey) {
            ev.preventDefault();
        } else if(!ev.key) {
            return;
        }

        requestAnimationFrame(() => dispatch((state, payload) => options.action(state, payload), {key: ev.key.toLowerCase(), code: ev.code, ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, metaKey: ev.metaKey, target: ev.target}))
    };
    addEventListener('keydown', handler); 
    return () => removeEventListener('keydown', handler);
}

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return data.display_graph;
    }

    const flattened = lib.scripts.flattenNode(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === node_id ? node.id + "/" + (node.out ?? 'out') : e.from,
                to: e.to === node_id ? node.id + "/" + (node.in ?? 'in') : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return {display_graph: {...display_graph, ...new_display_graph}, selected: node_id + '/' + (node.out ?? 'out')};
}

const contract_all = (graph) => {
    const node_ids = new Set(graph.nodes.map(n => n.id));
    let display_graph = graph;
    graph.nodes.forEach(g => {
        if(g.id.endsWith("/out") && !node_ids.has(g.id.substring(0, g.id.length - 4))) {
            display_graph = contract_node({node_id: g.id, display_graph}, true);
        }
    })

    return display_graph;
}

const contract_node = (data, keep_expanded=false) => {
    const node = data.display_graph.nodes.find(n => n.id === data.node_id);
    if(!node.nodes) {
        const slash_index = data.node_id.lastIndexOf('/');
        const node_id = slash_index >= 0 ? data.node_id.substring(0, slash_index) : data.node_id;
        const name = data.name ?? node_id;

        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        const dangling = new Set();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];

        while(q.length > 0) {
            const e = q.shift();
            dangling.delete(e.from);

            let this_dangling = 0;

            if(e.from !== data.node_id) {
                data.display_graph.edges.filter(ie => ie.from === e.from).forEach(ie => {
                    if(!inside_node_map.has(ie.to)) {
                        this_dangling += 1;
                        dangling.add(ie.to)
                    }
                });
            }

            if(this_dangling === 0) {
                in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                    inside_edges.add(ie)
                });

                in_edge = in_edge.filter(ie => ie.from !== e.from);

                const old_node = inside_nodes.find(i => e.from === i.id);
                let inside_node = old_node ?? data.display_graph.nodes.find(p => p.id === e.from);

                if(inside_node.name?.includes('in') && inside_node.name !== name + '/in') {
                    continue;
                }

                inside_node_map.set(inside_node.id, inside_node);
                inside_edges.add(e);
                if(!old_node) {
                    inside_nodes.push(inside_node);
                }

                data.display_graph.edges.filter(de => de.to === e.from).forEach(de => {
                    q.push(de);
                });
            } else {
                in_edge.push(e);
            }
        }

        let in_node_id = in_edge[0]?.to;

        if(in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return {display_graph: data.display_graph, selected: data.node_id};
        }

        const out_node = inside_nodes.find(n => n.id === data.node_id || n.name === name + "/out" || n.id === node_id + "/out");
        const out_node_id = out_node.id;

        const in_node = inside_node_map.get(in_node_id);

        // have to create a dummy in node if the in node does something
        if (in_node_id && !in_node_id.endsWith('in')) {
            in_node_id = node_id + "/in";
            inside_nodes.push({id: in_node_id});
            inside_edges.add({from: in_node_id, to: in_node.id});
        }

        if(!in_node_id) {
            in_node_id = inside_nodes.find(n => n.id === node_id + "/in" || n.name === name + "/in")?.id;
        }

        const edges = [];
        for(const e of inside_edges){
            edges.push({...e, 
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
                        id: node_id,
                        name,
                        in: in_node_id?.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
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
                        e.from === data.node_id ? {...e, from: node_id} 
                        : e.to === in_node?.id ? {...e, to: node_id} 
                        : inside_node_map.has(e.to) 
                        ? {...e, to: node_id}
                        : e
                    )
            };

        return {display_graph: {...display_graph, ...new_display_graph, in: in_node_id}, selected: node_id};
    }
}

const flattenNode = (graph, levels = -1) => {
    if (graph.nodes === undefined || levels === 0) {
        return graph;
    }

    // needs to not prefix base node because then flatten node can't run  next
    const prefix = graph.id ? `${graph.id}/` : '';

    return graph.nodes
        .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` }))
        .map(g => flattenNode(g, levels - 1))
        .reduce((acc, n) => Object.assign({}, acc, {
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []).map(fn => {
                // adjust for easy graph renaming
                if((fn.id === prefix + (graph.out ?? "out")) && graph.name) {
                    fn.name = graph.name;
                } else if (graph.in && (fn.id === prefix + (graph.in ?? "in")) && graph.name) {
                    fn.name = graph.name + "/in"
                }
                return fn
            }),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                Object.assign({}, e, { to: `${e.to}/${n.in ?? 'in'}` }) :
                e.from === n.id ?
                Object.assign({}, e, { from: `${e.from}/${n.out ?? 'out'}` }) :
                e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes
                .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` })),
            flat_edges: graph.edges
                .map(e => ({ ...e, from: `${prefix}${e.from}`, to: `${prefix}${e.to}` }))
        }));
}


/////////////////////////////////

const lib = {
    _,
    ha: { h, app, text, memo },
    no: {executeGraph},
    scripts: {d3simulation, d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    Fuse,
    // THREE
};

const generic_nodes = new Set([
    "switch",
    "filter",
    "delete",
    "default",
    "trigger",
    "execute_graph",
    "get",
    "set",
    "default_node_display",
    "h",
    "h_text",
    "default_error_display",
    "graph_display",
    "number_display",
    "update_and_run",
    "selected_node",
    "array"
]);

const stored = localStorage.getItem("display_graph");
// const display_graph = DEFAULT_GRAPH;
const display_graph = stored ? JSON.parse(stored) : test_graph;
console.log(display_graph);
const state = new Map([['in', [{graph: DEFAULT_GRAPH, display_graph: {...display_graph, nodes: display_graph.nodes.concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id) && display_graph.nodes.findIndex(dn => dn.id === n.id) === -1)), edges: display_graph.edges.concat([])}}]]])

console.log(executeGraph({state, graph: DEFAULT_GRAPH, out: "hyperapp_app"})[0]);

