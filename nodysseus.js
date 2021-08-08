import DEFAULT_GRAPH from "./pull.json"
import _ from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import { selectSyntaxLeft } from "@codemirror/commands";

const executeGraph = (state, graph, out) => {
    let state_size = 1;
    let active_nodes_size = 0;

    const active_nodes = new Map([[ "out", Object.assign({}, graph.nodes.find(n => n.id === out), {
        edges: graph.edges.filter(e => e.to === out),
        _nodeflag: true
    })]]);

    while(!state.has(out)) {
        if(state.size === state_size && active_nodes_size === active_nodes.size) {
            throw new Error("stuck");
        }

        state_size = state.size;
        active_nodes_size = active_nodes.size;

        for(const node of active_nodes.values()) {
            let run = true;
            // edge types
            //   ref
            //   data (default)

            for(const edge of node.edges) {
                if(edge?.type !== "ref" && !state.has(edge.from)){
                    if(!active_nodes.has(edge.from)) {
                        active_nodes.set(edge.from, Object.assign({}, graph.nodes.find(n => n.id === edge.from), {
                            edges: graph.edges.filter(e => e.to === edge.from),
                            _nodeflag: true
                        }));
                    }

                    run = false;
                }
            }

            if(node.type && !state.has(node.type)) {
                if(!active_nodes.has(node.type)) {
                    active_nodes.set(node.type, Object.assign({}, graph.nodes.find(n => n.id === node.type), {
                        edges: graph.edges.filter(e => e.to === node.type),
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

                    if(node.type) {
                        Object.assign(node, state.get(node.type)[0])
                    }

                    for(const edge of node.edges) {
                        datas = datas.flatMap(current_data =>
                            edge?.type === "ref" 
                            ? Object.assign({}, current_data, {[edge.as]: edge.from})
                            : edge?.type === "concat" 
                            ? Object.assign({}, current_data, {[edge.as]: state.get(edge.from)})
                            : state.get(edge.from).map(d => edge.as 
                                ? Object.assign({}, current_data, {[edge.as]: d})
                                : Object.assign({}, current_data, d))
                        );
                    }

                    if(datas.length > 1) {
                        debugger;
                    }

                    if(node.script) {
                        const fn = new Function(
                            'lib', 
                            'node', 
                            ...node.inputs, 
                            node.script
                            );
                        state.set(node.id, datas.map(d => fn(lib, node, ...node.inputs.map(i => d[i] ?? new Error(`${i} not found`)))).flat());
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

const lib = {
    _,
    ha: { h, app, text, memo },
    no: {executeGraph},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
};

const state = new Map([['in', [{graph: DEFAULT_GRAPH}]]])

console.log(state);

console.log(executeGraph(state, DEFAULT_GRAPH, "hyperapp")[0]);

//    no: { map_path_fn, flatten, unpackTypes, hFn, fnDef, fnReturn, concatValues, verify, d3simulation, debug, flatten_node, expand_node, node_click, contract_node, update_simulation_nodes, map_displaygraph_to_simulation_graph, run_displaygraph, view_flatten_nodes},