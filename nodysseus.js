import DEFAULT_GRAPH from "./flatten.json"
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
            for(const edge of node.edges) {
                if(!state.has(edge.from)){
                    if(!active_nodes.has(edge.from)) {
                        active_nodes.set(edge.from, Object.assign({}, graph.nodes.find(n => n.id === edge.from), {
                            edges: graph.edges.filter(e => e.to === edge.from),
                            _nodeflag: true
                        }));
                    }

                    run = false;
                }
            }

            if (run) {
                const unpacked_node = unpackTypes(state.get('node_types')[0], node);
                const fn = new Function('lib', 'node', ...unpacked_node.inputs, unpacked_node.script);
                let datas = [{fn}];
                for(const edge of node.edges) {
                    datas = datas.flatMap(current_data =>
                        state.get(edge.from).map(d => edge.as 
                            ? Object.assign({}, current_data, {[edge.as]: d})
                            : Object.assign({}, current_data, d))
                    );
                }

                state.set(node.id, datas.map(d => d.fn(lib, node, ...unpacked_node.inputs.map(i => d[i]))));
            }
        }
    }

    return state.get(out);
};

const test_graph = {
    nodes: [
        {
            "id": "out",
            "inputs": ["value"],
            "script": "return value" 
        },
        {
            "id": "get_test_path",
            "type": "get"
        },
        {
            "id": "test_path",
            "type": "constant",
            "value": "test_path"
        }
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
    no: {},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
};

const state = new Map([['in', [{test_path: 'test value'}]], ["node_types", [{
    "get": {
        "inputs": ["target", "path"],
        "script": "return target[path]"
    },
    "constant": {
        "inputs": [],
        "script": "return node.value"
    }

}]]])

console.log(state);

console.log(executeGraph(state, test_graph, "out"));

//    no: { map_path_fn, flatten, unpackTypes, hFn, fnDef, fnReturn, concatValues, verify, d3simulation, debug, flatten_node, expand_node, node_click, contract_node, update_simulation_nodes, map_displaygraph_to_simulation_graph, run_displaygraph, view_flatten_nodes},