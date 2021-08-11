import DEFAULT_GRAPH from "./pull.json"
import _ from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import { selectSyntaxLeft } from "@codemirror/commands";

const executeGraph = (state, graph, out) => {
    let state_hash = "";
    let active_nodes_hash = "";

    const active_nodes = new Map([[ "out", Object.assign({}, graph.nodes.find(n => n.id === out), {
        inputs: graph.edges.filter(e => e.to === out),
        _nodeflag: true
    })]]);

    while(!state.has(out)) {
        let new_state_hash = "";
        for(const k of state.keys()) {
            new_state_hash += k;
        }
        let new_active_hash = "";
        for(const k of active_nodes.keys()) {
            new_active_hash += k;
        }

        if(state_hash === new_state_hash && active_nodes_hash === new_active_hash) {
            throw new Error("stuck");
        }

        state_hash = new_state_hash;
        active_nodes_hash = new_active_hash;

        for(const node of active_nodes.values()) {
            let run = true;
            // edge types
            //   ref gets the node id
            //   concat puts all the data as the "as" attribute
            //   data (default)

            for(const input of node.inputs) {
                if(input?.type !== "ref" && !state.has(input.from)){
                    if(!active_nodes.has(input.from)) {
                        const input_node = graph.nodes.find(n => n.id === input.from);

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

            if(node.type && !state.has(node.type)) {
                if(!active_nodes.has(node.type)) {
                    active_nodes.set(node.type, Object.assign({}, graph.nodes.find(n => n.id === node.type), {
                        inputs: graph.edges.filter(e => e.to === node.type),
                        _nodetypeflag: true,
                        _nodeflag: true
                    }))
                }

                run = false;
            }

            if (run) {
                let datas = [{}];
                if (node.value) {
                    state.set(node.id, [node.value].flat());
                    active_nodes.delete(node.id);
                } else {
                    const inputs = node.inputs.concat([]);

                    inputs.sort((a, b) => 
                        a.order !== undefined && b.order !== undefined
                        ? a.order - b.order 
                        : a.order !== undefined && b.order === undefined
                        ? 0
                        : b.order !== undefined && a.order === undefined
                        ? 1
                        : a.as && !b.as 
                        ? 1 : 0
                    );

                    for(const input of inputs) {
                        if(input?.type === "concat") {
                            if(state.get(input.from).length > 0 || datas[0][input.as] === undefined) {
                                datas = datas.map(d => Object.assign({}, d, {[input.as]: state.get(input.from)}))
                            } else {
                                debugger;
                            }
                        } else if (input?.type === "ref") {
                            datas = datas.map(d => Object.assign({}, d, {[input.as]: input.from}))
                        } else if (state.get(input.from).length > 1 && datas.length > 1) {
                            state.get(input.from).forEach((d, i) =>{
                                datas[i] = Object.assign({}, datas.length > i ? datas[i] : {}, input.as ? {[input.as]: d} : d);
                            });
                        } else if(state.get(input.from).length > 0) {
                            datas = datas.flatMap(current_data =>
                                state.get(input.from).map(d => input.as 
                                    ? Object.assign({}, current_data, {[input.as]: d})
                                    : Object.assign({}, current_data, d))
                            );
                        }
                    }

                    const node_type = node.type 
                        ? Object.assign({}, state.get(node.type)[0], node, {_nodetypeflag: false})
                        : node;

                    if (!node._nodetypeflag && node_type.nodes && node_type.edges){
                        state.set(node.id + "/in", datas);
                        active_nodes.set(node.id, {
                            id: node.id, 
                            args: ["value"],
                            inputs:[{from: `${node.id}/out`, to: node.id, as: "value"}], 
                            _nodeflag: true, 
                            script: "return value"
                        })

                        for(const child of node_type.nodes){
                            graph.nodes.push(Object.assign({}, child, {id: `${node.id}/${child.id}`}))
                        }

                        for(const edge of node_type.edges){
                            graph.edges.push(Object.assign({}, edge, {from: `${node.id}/${edge.from}`, to: `${node.id}/${edge.to}`}));
                        }
                    } else if(node.script) {
                        const fn = new Function(
                            'lib', 
                            'node', 
                            ...node.args, 
                            node.script
                            );
                        state.set(node.id, datas.map(d => fn(lib, node, ...node.args.map(i => {
                            if(d[i] === undefined){
                                console.log(node);
                                console.log(d);
                                throw new Error(`${i} not found`);
                            }
                            return d[i];
                        }))).flat());
                        active_nodes.delete(node.id);
                    } else if(node._nodetypeflag) {
                        state.set(node.id, [{nodes: node.nodes, edges: node.edges}])
                        active_nodes.delete(node.id);
                    } else {
                        state.set(node.id, datas);
                        active_nodes.delete(node.id);
                    }
                }
            }
        }
    }

    return state.get(out);
};

const test_graph = {
    nodes: [
        {
            "id": "out",
            "inputs": ["value"]
        },
        {
            "id": "get_test_path",
            "type": "get"
        },
        {
            "id": "test_path",
            "value": "test_path"
        },
        {
            "id": "get", 
            "inputs": ["inputs", "script"]
        },
        {
            "id": "get_inputs",
            "value": ["target", "path"]
        },
        {
            "id": "get_script",
            "value": "return target[path]"
        },
    ],
    edges: [
        {
            "from": "in",
            "to": "get_test_path",
            "as": "target"
        },
        {
            "from": "get_test_path",
            "to": "out",
            "as": "value"
        },
        {
            "from": "test_path",
            "to": "get_test_path",
            "as": "path"
        },
        {
            "from": "get_inputs",
            "to":  "get",
            "as": "inputs"
        },
        {
            "from": "get_script",
            "to":  "get",
            "as": "script"
        }
    ]
}



// Note: heavy use of comma operator https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_Operator
const unpackTypes = (node_types, node) => {
    let ty = typeof node === 'string' ? node : node.type;
    const result = typeof node === 'string' ? {} : Object.assign({}, node)
    while (ty && node_types[ty]) {
        Object.assign(result, node_types[ty]);
        ty = node_types[ty].type;
    }
    return result;
}


const state = new Map([['in', [{graph: DEFAULT_GRAPH}]]])


//    no: { map_path_fn, flatten, unpackTypes, hFn, fnDef, fnReturn, concatValues, verify, d3simulation, debug, flatten_node, expand_node, node_click, contract_node, update_simulation_nodes, map_displaygraph_to_simulation_graph, run_displaygraph, view_flatten_nodes},


//////////
// TODO: convert these to nodes

const calculateLevels = (graph, out) => {
    const levels = graph.edges.filter(e => e.to === out).map(bfs(graph, 1)).flat()
        .reduce(
            (acc, v) => acc.set(v[0], Math.max(v[1], acc.get(v[0]) ?? 0)),
            new Map()
        ).set(out, 0);

    return {
        levels,
        min: Math.min(...levels.values()),
        max: Math.max(...levels.values()),
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {})
    }
}

const bfs = (graph, level) => (edge) => [
    [edge.from, level]
].concat(graph.edges.filter(e => e.to === edge.from).map(bfs(graph, level + 1)).flat());

const d3simulation = () => {
    const simulation =
        lib.d3.forceSimulation()
        .force('charge', lib.d3.forceManyBody().strength(-50).distanceMax(128))
        .force('collide', lib.d3.forceCollide(32))
        // .force('center', lib.d3
        // 	.forceCenter(window.innerWidth * 0.5, window.innerHeight * 0.5)
        // 	.strength(.01))
        .force('links', lib.d3
            .forceLink([])
            .distance(64)
            .strength(0.1)
            .id(n => n.node_id))
        .force('link_direction', lib.d3.forceY().strength(1))
        .force('link_siblings', lib.d3.forceX().strength(1))
        .velocityDecay(0.7)
        .alphaMin(.2);

    return { simulation };
}

const updateSimulationNodes = (data) => {
    const bfs = (level) => (edge) => [
        [edge.to, level]
    ].concat(data.display_graph.edges.filter(e => e.from === edge.to).map(bfs(level + 1)).flat());

    const levels = calculateLevels(data.display_graph, 'hyperapp_app');

    data.simulation.nodes(data.nodes);

    data.simulation.force('links').links(data.links);
    data.simulation.force('link_direction')
        .y((n) => window.innerHeight * (0.075 + 0.85 * (levels.levels.get(n.node_id) ?? 0) / (levels.max - levels.min)) +
            (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                64 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - (levels.nodes_by_level[levels.levels.get(n.node_id)].length - 1) * 64 * 0.5 :
                0));

    data.simulation.force('link_siblings')
        .x((n) => window.innerWidth * 0.5 +
            (levels.levels.has(n.node_id) && levels.levels.get(n.node_id) !== undefined ?
                (256 * levels.nodes_by_level[levels.levels.get(n.node_id)].indexOf(n.node_id) - levels.nodes_by_level[levels.levels.get(n.node_id)].length * 256 * 0.5) :
                window.innerWidth * 0.25));

    data.simulation
        // .force(`parent_${data.node_id}`, lib.d3.forceRadial(0, data.x, data.y).strength(n => n.parent === data.node_id ? 0.2 : 0))
        // .force(`not_parent_${data.node_id}`, lib.d3.forceRadial(512, data.x, data.y).strength(n => n.parent === data.node_id ? 0 : 0.2))
        // .force(`center`, null)
        // .velocityDecay(.2)
        .alpha(0.4).restart();

    return {};
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
            x: current_data?.x ?? data.x ?? window.innerWidth * (Math.random() * .5 + .25),
            y: current_data?.y ?? data.y ?? window.innerHeight * (Math.random() * .5 + .25)
        };
    })

    const links = data.display_graph.edges
        .filter(e => e.to !== "log" && e.to !=="debug")
        .map(e => ({source: e.from, target: e.to, as: e.as, type: e.type}));

    return {
        ...data,
        nodes,
        links
    }
}

const d3subscription = simulation => dispatch => { 
    simulation.on('tick.ha', () => { 
        requestAnimationFrame(() => dispatch(s => ({ 
            ...s, 
            nodes: simulation.nodes().map(n => ({node_id: n.node_id, x: Math.floor(n.x), y: Math.floor(n.y), type: n.type, value: n.value, nodes: n.nodes, edges: n.edges, script: n.script})), 
            links: simulation.force('links').links().map(l => ({
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
            }))  
        }))) 
    }); 

    return () => simulation.on('.ha', null); 
}

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)
    console.log('expand');

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return data.display_graph;
    }

    const flattened = lib.scripts.flattenNode(node, 1);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.node_id !== node_id)
            .concat(flattened.flat_nodes),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === node_id ? `${node_id}/out` : e.from,
                to: e.to === node_id ? `${node_id}/in` : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return new_display_graph;
}

const contract_node = (data) => {
    const node_id = data.node_id.endsWith('in') ?
        data.node_id.substring(0, data.node_id.length - 3) :
        data.node_id.substring(0, data.node_id.length - 4);

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => !n.id.startsWith(node_id))
            .concat([{
                id: node_id,
                nodes: data.display_graph.nodes
                    .filter(n => n.id.startsWith(node_id))
                    .map(n => ({...n, id: n.id.substring(node_id.length + 1)})),
                edges: data.display_graph.edges
                    .filter(e => e.from.startsWith(node_id) && e.to.startsWith(node_id))
                    .map(e =>({
                        as: e.as,
                        from: e.from.substring(node_id.length + 1),
                        to: e.to.substring(node_id.length + 1),
                    }))
            }]),
        edges: data.display_graph.edges
            .map(e => ({
                ...e,
                from: e.from === `${node_id}/out` ? node_id : e.from,
                to: e.to === `${node_id}/in` ? node_id : e.to
            }))
            .filter(e => !(e.from.startsWith(`${node_id}/`) || e.to.startsWith(`${node_id}/`)))
    };

    return new_display_graph;
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
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                Object.assign(e, { to: `${e.to}/in` }) :
                e.from === n.id ?
                Object.assign(e, { from: `${e.from}/out` }) :
                e :
                e).flat().concat(n.flat_edges).filter(e => e !== undefined)
        }), Object.assign({}, graph, {
            flat_nodes: graph.nodes
                .map(n => Object.assign({}, n, { id: `${prefix}${n.id}` })),
            flat_edges: graph.edges
                .map(e => ({ from: `${prefix}${e.from}`, to: `${prefix}${e.to}`, as: e.as }))
        }));
}


/////////////////////////////////

const lib = {
    _,
    ha: { h, app, text, memo },
    no: {executeGraph},
    scripts: {d3simulation, d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
};

console.log(executeGraph(state, DEFAULT_GRAPH, "hyperapp_app")[0]);