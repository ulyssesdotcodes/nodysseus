import DEFAULT_GRAPH from "./pull.json"
import _ from "lodash";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import { selectSyntaxLeft } from "@codemirror/commands";
import Fuse from "fuse.js";

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

const executeGraph = ({state, graph, out}) => {
    graph = contract_all(graph);

    let state_hash = "";
    let active_nodes_hash = "";

    let state_length = 0;
    let active_nodes_length = 0;

    const active_nodes = new Map([[ "out", Object.assign({}, graph.nodes.find(n => n.id === out), {
        inputs: graph.edges.filter(e => e.to === out),
        _nodeflag: true
    })]]);


    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    while(!state.has(out)) {

        if(state_length === state.size && active_nodes_length === active_nodes.size) {
            console.log(graph);
            console.log(state);
            console.log(active_nodes);
            throw new Error("stuck");
        }

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


            if(node.type && !state.has(node.type)) {
                if(!active_nodes.has(node.type)) {
                    active_nodes.set(node.type, Object.assign({}, node_map.get(node.type), {
                        inputs: graph.edges.filter(e => e.to === node.type),
                        _nodetypeflag: true,
                        _nodeflag: true
                    }))
                }

                run = false;
            }

            if (run) {
                let datas = [{}];
                if (node.value !== undefined) {
                    state.set(node.id, [node.value].flat());
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
                    for(let i = 0; i < inputs.length; i++) {
                        input = inputs[i];
                        if(datas.length === 0) {
                            break;
                        } else if(input?.type === "concat") {
                            if(state.get(input.from).length > 0 || datas[0][input.as] === undefined) {
                                datas.forEach(d => Object.assign(d, {[input.as]: state.get(input.from)}))
                            }
                        } else if (input?.type === "ref") {
                            datas.forEach(d => Object.assign(d, {[input.as]: input.from}))
                        } else if (state.get(input.from).length > 1 && datas.length > 1) {
                            state.get(input.from).forEach((d, i) =>{
                                datas[i] = Object.assign(datas.length > i ? datas[i] : {}, input.as ? {[input.as]: d} : d);
                            });
                        } else if (state.get(input.from).length > 0) {
                            const new_datas = []
                            const state_datas = state.get(input.from);
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

                    const node_type = node.type 
                        ? Object.assign({}, state.get(node.type)[0], node, {_nodetypeflag: false})
                        : node;

                    if(node._nodetypeflag) {
                        state.set(node.id, node.nodes ? [{nodes: node.nodes, edges: node.edges}] : [{args: node.args, script: node.script, value: node.value}])
                        active_nodes.delete(node.id);
                    } else if (node_type.nodes && node_type.edges){
                        state.set(node.id + "/in", datas);
                        active_nodes.set(node.id, {
                            id: node.id, 
                            args: ["value"],
                            inputs:[{from: `${node.id}/out`, to: node.id, as: 'value'}], 
                            _nodeflag: true, 
                            script: "return value"
                        })

                        if(!node_map.has(`${node.id}/out`)) {
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
                            const arg_names = new Set(node_type.args);
                            node.inputs.forEach(i => {
                                if(i.as && !keywords.has(i.as)) {
                                    arg_names.add(i.as);
                                }
                            })
                            const arg_name_values = [...arg_names];
                            const fn = new Function(
                                'lib', 
                                'node', 
                                ...arg_names,
                                node_type.script
                                );
                            const state_datas = []
                            const args = [lib, node];
                            let fn_args = [];
                            for(let i = 0; i < datas.length; i++) {
                                fn_args = args.slice();
                                for(let j = 0; j < arg_name_values.length; j++) {
                                    fn_args.push(datas[i][arg_name_values[j]]);
                                }

                                const results = fn.apply(null, fn_args);
                                Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
                            }
                            state.set(node.id, state_datas);
                            active_nodes.delete(node.id);
                        } catch (e) {
                            console.log(`error in node`);
                            console.dir(node_type);
                            console.error(e);
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

    return state.get(out);
};

const test_graph = {
    "nodes": [
        {
            "id": "out",
            "args": [
                "value"
            ],
            "script": "return value;"
        },
        {
            "id": "get_inputs",
            "value": "value"
        },
        {
            "id": "get_script",
            "value": "value"
        },
        {
            "id": "lvfabiz9b",
            "name": "css",
            "args": [
                "el",
                "styles"
            ],
            "script": "el.innerHTML = styles;\n\nreturn styles;"
        },
        {
            "id": "2jiztgmvr",
            "name": "css_el",
            "args": [
                "get_el",
                "create_el"
            ],
            "type": "switch"
        },
        {
            "id": "vpq73g9qg",
            "name": "get_el",
            "script": "return document.querySelector('.css-styles')",
            "args": []
        },
        {
            "id": "zruw6k6l9",
            "name": "el classname",
            "args": [
                "el"
            ],
            "script": "el.className = \"css-styles\"; document.body.appendChild(el); return el;"
        },
        {
            "id": "x8tdpkazf",
            "name": "css el inputs",
            "script": "return document.querySelector(\".css-styles\") ? [\"get_el\"] : [\"create_el\"];",
            "args": []
        },
        {
            "id": "dfbmreaek",
            "name": "create el",
            "script": "return document.createElement(\"style\");",
            "args": []
        },
        {
            "id": "filter",
            "nodes": [
                {
                    "id": "in"
                },
                {
                    "id": "out",
                    "args": [
                        "keep",
                        "data"
                    ],
                    "script": "return keep ? [data] : []"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "order": 1
                },
                {
                    "from": "in",
                    "to": "out",
                    "as": "data",
                    "order": 0
                }
            ]
        },
        {
            "id": "delete",
            "nodes": [
                {
                    "id": "in"
                },
                {
                    "id": "out",
                    "args": [
                        "data",
                        "path"
                    ],
                    "script": "const new_data = Object.assign({}, data); delete new_data[path]; return new_data;"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "order": 1
                },
                {
                    "from": "in",
                    "to": "out",
                    "as": "data",
                    "order": 0
                }
            ],
            "value": "value"
        },
        {
            "id": "switch",
            "nodes": [
                {
                    "id": "in"
                },
                {
                    "id": "out",
                    "args": [
                        "data",
                        "input"
                    ],
                    "script": "return data[Object.getOwnPropertyNames(data)[0]];"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "as": "data"
                }
            ]
        },
        {
            "id": "trigger",
            "nodes": [
                {
                    "id": "in"
                },
                {
                    "id": "trigger",
                    "args": [
                        "trigger"
                    ],
                    "script": "return trigger ? ['in'] : []"
                },
                {
                    "id": "out",
                    "args": [
                        "data"
                    ],
                    "script": "return data?.data ?? []"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out",
                    "as": "data"
                },
                {
                    "from": "in",
                    "to": "trigger"
                },
                {
                    "from": "trigger",
                    "to": "out",
                    "type": "inputs"
                }
            ]
        },
        {
            "id": "execute_graph",
            "nodes": [
                {
                    "id": "in",
                    "value": null
                },
                {
                    "id": "out",
                    "args": [
                        "in_node",
                        "out_node",
                        "graph"
                    ],
                    "script": "return (...args) => (lib.no.executeGraph({state: new Map([[in_node, args]]), graph, out: out_node }))"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out"
                }
            ]
        },
        {
            "id": "vr865hcv0",
            "name": "body"
        },
        {
            "id": "kvq1q0k30",
            "value": "#ccc"
        },
        {
            "id": "qpao2izqz",
            "name": "circle"
        },
        {
            "id": "u7sy8fwro",
            "value": "black"
        },
        {
            "id": "56j09nio2",
            "value": 1
        },
        {
            "id": "1t96plqko",
            "name": "text"
        },
        {
            "id": "bacr589n7",
            "type": "css",
            "name": "stringify_css"
        },
        {
            "id": "3xppcpetm",
            "args": [],
            "value": 1
        },
        {
            "id": "6ffivp2aw",
            "args": [],
            "value": 0
        },
        {
            "id": "4ol7uqdfr",
            "args": [],
            "value": "2s blink infinite"
        },
        {
            "id": "29hvv137x",
            "args": [],
            "value": "opacity"
        },
        {
            "id": "w62vgl3ln",
            "args": [],
            "value": "consolas"
        },
        {
            "id": "7xg2ng5r0",
            "type": "two_value_anim",
            "name": "blink anim"
        },
        {
            "id": "in",
            "args": [],
            "name": "in"
        },
        {
            "id": "c6h6qfqbw",
            "args": [
                "increase_decrease"
            ],
            "name": "key_listener",
            "script": "return increase_decrease ?? 'no key listener events';"
        },
        {
            "id": "ajj5t166a",
            "type": "set",
            "name": "set_value_increase_decrease"
        },
        {
            "id": "set",
            "args": [],
            "name": "set",
            "script": "return lib._.set(target, path, value);"
        },
        {
            "id": "r8cqojmo1",
            "args": [],
            "script": "return typeof start_value !== 'number' ? start_value : key === 'i' ? start_value + 1 : key === 'd' ? start_value - 1 : start_value;",
            "name": "modify_value"
        },
        {
            "id": "fj2x64arr",
            "args": [],
            "name": "key_listener_inputs",
            "script": "return typeof value === 'number' ? ['increase_decrease'] : []"
        },
        {
            "id": "qtb69pl8t",
            "args": [],
            "type": "get",
            "name": "get_value"
        },
        {
            "id": "mdwg7wfgu",
            "args": [],
            "value": "value"
        },
        {
            "id": "jtbamz3os",
            "type": "get_selected_node",
            "name": "in_selected_node"
        },
        {
            "id": "two_value_anim",
            "name": "two_value_anim",
            "nodes": [
                {
                    "id": "out",
                    "args": [
                        "attr",
                        "to",
                        "from"
                    ],
                    "name": "two_value_anim/out",
                    "script": "return {to: {[attr]: to}, from: {[attr]: from}};"
                },
                {
                    "id": "in",
                    "args": [],
                    "name": "two_value_anim/in"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out"
                }
            ]
        },
        {
            "id": "css",
            "name": "css",
            "nodes": [
                {
                    "id": "out",
                    "name": "css/out",
                    "script": "return rules?.join(\"\\n\");",
                    "args": [
                        "rules"
                    ]
                },
                {
                    "id": "mec78sn2n",
                    "name": "compile",
                    "args": [
                        "init",
                        "attrs",
                        "end",
                        "keyframes"
                    ],
                    "script": "return [init].concat(attrs ?? []).concat(keyframes ?? []).concat([end])"
                },
                {
                    "id": "2ll8r3sx5",
                    "name": "init",
                    "args": [
                        "entry"
                    ],
                    "script": "return entry[0] + \" {\""
                },
                {
                    "id": "mrs40dwx8",
                    "value": "}"
                },
                {
                    "id": "h28e9j2fo",
                    "name": "attrs",
                    "args": [
                        "entry"
                    ],
                    "script": "return entry && entry.length > 0 ? [Object.entries(entry[1]).map(([k, v]) => `${k}: ${v};`)] : [];\n\n//return JSON.stringify(entry[1]);\n"
                },
                {
                    "id": "i6kzydhrf",
                    "args": [
                        "entry"
                    ],
                    "name": "attrs_keyframes",
                    "script": "return entry ? Object.entries(entry).map(([k,v]) => k + \" {\" + Object.entries(v).map(([k,v]) => `${k}: ${v}`) + \"}\" ).join(\"\\n\") + \"}\" : undefined"
                },
                {
                    "id": "ie18qgd52",
                    "name": "entries",
                    "script": "return Object.entries(input)",
                    "args": [
                        "input"
                    ]
                },
                {
                    "id": "0g05impwi",
                    "args": [
                        "entry"
                    ],
                    "name": "filter_non_keyframes",
                    "script": "return !entry ? [] : entry[0].startsWith(\"@keyframes\") ? [] : [entry];"
                },
                {
                    "id": "1axxnkooa",
                    "args": [
                        "entry"
                    ],
                    "name": "filter_keyframes",
                    "script": "return entry &&  entry[0].startsWith(\"@keyframes\") ? entry[1] : undefined;"
                },
                {
                    "id": "in",
                    "name": "css/in"
                }
            ],
            "edges": [
                {
                    "from": "mec78sn2n",
                    "to": "out",
                    "type": "concat",
                    "as": "rules"
                },
                {
                    "from": "2ll8r3sx5",
                    "to": "mec78sn2n",
                    "as": "init",
                    "name": "end"
                },
                {
                    "from": "mrs40dwx8",
                    "to": "mec78sn2n",
                    "as": "end"
                },
                {
                    "from": "h28e9j2fo",
                    "to": "mec78sn2n",
                    "as": "attrs"
                },
                {
                    "from": "i6kzydhrf",
                    "to": "mec78sn2n",
                    "as": "keyframes"
                },
                {
                    "from": "ie18qgd52",
                    "to": "2ll8r3sx5",
                    "as": "entry"
                },
                {
                    "from": "0g05impwi",
                    "to": "h28e9j2fo",
                    "as": "entry"
                },
                {
                    "from": "1axxnkooa",
                    "to": "i6kzydhrf",
                    "as": "entry"
                },
                {
                    "from": "in",
                    "to": "ie18qgd52",
                    "as": "input"
                },
                {
                    "from": "ie18qgd52",
                    "to": "0g05impwi",
                    "as": "entry"
                },
                {
                    "from": "ie18qgd52",
                    "to": "1axxnkooa",
                    "as": "entry"
                },
                {
                    "from": "in",
                    "to": "ie18qgd52",
                    "as": "input"
                },
                {
                    "from": "in",
                    "to": "ie18qgd52",
                    "as": "input"
                }
            ]
        },
        {
            "id": "default",
            "name": "default",
            "nodes": [
                {
                    "id": "out",
                    "args": [
                        "data",
                        "default_value"
                    ],
                    "script": "return data.length > 0 ? data : default_value"
                },
                {
                    "id": "in"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out"
                }
            ]
        },
        {
            "id": "get_selected_node",
            "name": "get_selected_node",
            "nodes": [
                {
                    "id": "out",
                    "args": [
                        "graph",
                        "selected"
                    ],
                    "name": "get_selected_node/out",
                    "script": "return graph?.nodes?.find(n => n.id === selected) ?? [];"
                },
                {
                    "id": "dh64fe0yi",
                    "args": [
                        "target"
                    ],
                    "name": "get_selected",
                    "script": "return target.selected[0]"
                },
                {
                    "id": "7y938lss2",
                    "args": [],
                    "type": "get",
                    "name": "get_display_graph"
                },
                {
                    "id": "scbdvvauy",
                    "args": [
                        "in_value"
                    ],
                    "script": "return in_value;",
                    "name": "in_value"
                },
                {
                    "id": "1xlhcil2e",
                    "args": [],
                    "value": "display_graph"
                },
                {
                    "id": "in",
                    "args": [],
                    "name": "get_selected_node/in"
                }
            ],
            "edges": [
                {
                    "from": "dh64fe0yi",
                    "to": "out",
                    "as": "selected"
                },
                {
                    "from": "7y938lss2",
                    "to": "out",
                    "as": "graph"
                },
                {
                    "from": "scbdvvauy",
                    "to": "dh64fe0yi",
                    "as": "target"
                },
                {
                    "from": "1xlhcil2e",
                    "to": "7y938lss2",
                    "as": "path"
                },
                {
                    "from": "scbdvvauy",
                    "to": "7y938lss2",
                    "as": "target"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                },
                {
                    "from": "in",
                    "to": "scbdvvauy",
                    "as": "in_value"
                }
            ]
        },
        {
            "id": "cv9akpm4i",
            "args": [],
            "value": 4
        },
        {
            "id": "get",
            "name": "get",
            "nodes": [
                {
                    "id": "out",
                    "args": [
                        "target",
                        "path",
                        "def"
                    ],
                    "script": "return [lib._.get(target, path) ?? def]"
                },
                {
                    "id": "in"
                },
                {
                    "id": "fill_default",
                    "args": [
                        "input"
                    ],
                    "script": "return input.default ?? null"
                }
            ],
            "edges": [
                {
                    "from": "in",
                    "to": "out"
                },
                {
                    "from": "fill_default",
                    "to": "out",
                    "as": "def"
                },
                {
                    "from": "in",
                    "to": "out"
                },
                {
                    "from": "fill_default",
                    "to": "out",
                    "as": "def"
                },
                {
                    "from": "in",
                    "to": "fill_default",
                    "as": "input"
                },
                {
                    "from": "in",
                    "to": "fill_default",
                    "as": "input"
                },
                {
                    "from": "in",
                    "to": "fill_default",
                    "as": "input"
                },
                {
                    "from": "in",
                    "to": "fill_default",
                    "as": "input"
                }
            ]
        },
        {
            "id": "8521eyel9",
            "type": "get_key",
            "name": "in_key"
        },
        {
            "id": "get_key",
            "name": "get_key",
            "nodes": [
                {
                    "id": "out",
                    "args": [],
                    "name": "get_key/out",
                    "type": "get"
                },
                {
                    "id": "icfpfcgc2",
                    "args": [],
                    "value": "key"
                },
                {
                    "id": "in",
                    "args": [],
                    "name": "get_key/in"
                }
            ],
            "edges": [
                {
                    "from": "icfpfcgc2",
                    "to": "out",
                    "as": "path"
                },
                {
                    "from": "in",
                    "to": "out",
                    "as": "target"
                }
            ]
        }
    ],
    "edges": [
        {
            "from": "lvfabiz9b",
            "to": "out",
            "as": "value_"
        },
        {
            "from": "2jiztgmvr",
            "to": "lvfabiz9b",
            "as": "el"
        },
        {
            "from": "vpq73g9qg",
            "to": "2jiztgmvr",
            "as": "get_el"
        },
        {
            "from": "zruw6k6l9",
            "to": "2jiztgmvr",
            "as": "create_el"
        },
        {
            "from": "x8tdpkazf",
            "to": "2jiztgmvr",
            "type": "inputs"
        },
        {
            "from": "dfbmreaek",
            "to": "zruw6k6l9",
            "as": "el"
        },
        {
            "from": "bacr589n7",
            "to": "lvfabiz9b",
            "as": "styles"
        },
        {
            "from": "vr865hcv0",
            "to": "bacr589n7",
            "as": "body",
            "name": "light-grey",
            "value": "#ccc"
        },
        {
            "from": "kvq1q0k30",
            "to": "vr865hcv0",
            "as": "background-color"
        },
        {
            "from": "qpao2izqz",
            "to": "bacr589n7",
            "as": "circle"
        },
        {
            "from": "u7sy8fwro",
            "to": "qpao2izqz",
            "as": "stroke"
        },
        {
            "from": "56j09nio2",
            "to": "qpao2izqz",
            "as": "stroke-width"
        },
        {
            "from": "1t96plqko",
            "to": "bacr589n7",
            "as": "text"
        },
        {
            "from": "4ol7uqdfr",
            "to": "qpao2izqz",
            "as": "animation_"
        },
        {
            "from": "6ffivp2aw",
            "to": "7xg2ng5r0",
            "as": "from"
        },
        {
            "from": "3xppcpetm",
            "to": "7xg2ng5r0",
            "as": "to"
        },
        {
            "from": "29hvv137x",
            "to": "7xg2ng5r0",
            "as": "attr"
        },
        {
            "from": "w62vgl3ln",
            "to": "1t96plqko",
            "as": "font-family"
        },
        {
            "from": "7xg2ng5r0",
            "to": "bacr589n7",
            "as": "@keyframes blink"
        },
        {
            "from": "jtbamz3os",
            "to": "ajj5t166a",
            "as": "target"
        },
        {
            "from": "fj2x64arr",
            "to": "c6h6qfqbw",
            "type": "inputs"
        },
        {
            "from": "jtbamz3os",
            "to": "qtb69pl8t",
            "as": "target"
        },
        {
            "from": "mdwg7wfgu",
            "to": "qtb69pl8t",
            "as": "path"
        },
        {
            "from": "qtb69pl8t",
            "to": "r8cqojmo1",
            "as": "start_value"
        },
        {
            "from": "8521eyel9",
            "to": "r8cqojmo1",
            "as": "key"
        },
        {
            "from": "mdwg7wfgu",
            "to": "ajj5t166a",
            "as": "path"
        },
        {
            "from": "qtb69pl8t",
            "to": "fj2x64arr",
            "as": "value"
        },
        {
            "from": "c6h6qfqbw",
            "to": "out",
            "as": "value_"
        },
        {
            "from": "ajj5t166a",
            "to": "c6h6qfqbw",
            "as": "increase_decrease"
        },
        {
            "from": "r8cqojmo1",
            "to": "ajj5t166a",
            "as": "value"
        },
        {
            "from": "in",
            "to": "jtbamz3os"
        },
        {
            "from": "cv9akpm4i",
            "to": "out"
        },
        {
            "from": "in",
            "to": "8521eyel9"
        }
    ]
}


//////////
// TODO: convert these to nodes

const calculateLevels = (graph, selected) => {

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
    const siblings = new Map(graph.nodes.map(n => [n.id, [...(new Set(parents.get(n.id)?.flatMap(p => children.get(p)?.filter(c => c !== n.id) ?? []).concat(children.get(n.id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values())]]))
    const distance_from_selected = new Map();

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
        nodes_by_level: [...levels.entries()].reduce((acc, [n, l]) => (acc[l] ? acc[l].push(n) : acc[l] = [n], acc), {})
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
        .force('charge', lib.d3.forceManyBody().strength(-8).distanceMax(1024))
        .force('collide', lib.d3.forceCollide(32))
        .force('links', lib.d3
            .forceLink([])
            .distance(128)
            .strength(1)
            .id(n => n.node_id))
        .force('link_direction', lib.d3.forceY().strength(1))
        .force('link_siblings', lib.d3.forceX().strength(1))
        // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
        .velocityDecay(0.7)
        .alphaMin(.2);

    return { simulation };
}

const updateSimulationNodes = (data) => {
    const selected = data.selected[0];
    const levels = data.levels ?? calculateLevels(data.display_graph, data.display_graph_out);
    const selected_level = levels.level_by_node.get(selected);

    if(typeof(data.links?.[0]?.source) === "string") {
        data.simulation.nodes(data.nodes);
        data.simulation.force('links').links(data.links);
    }

    const sibling_x = new Map();
    const selected_x =  ((levels.nodes_by_level[selected_level].findIndex(l => l === selected) + 1) 
                / (levels.nodes_by_level[selected_level].length + 1));


    data.nodes.forEach(n => {
        sibling_x.set(n.node_id, 
            (levels.level_by_node.has(n.node_id)
            ?  (((levels.nodes_by_level[levels.level_by_node.get(n.node_id)].findIndex(l => l === n.node_id) + 1) 
                / (levels.nodes_by_level[levels.level_by_node.get(n.node_id)].length + 1)) - selected_x) 
                / (Math.min(3, levels.distance_from_selected.get(n.node_id)) * 0.25 + 1) + 0.5
            : 0.75)
                * window.innerWidth
        );
    })

    data.simulation.force('link_siblings').x((n) => sibling_x.get(n.node_id));

    data.simulation.force('charge')
        .strength(n => levels.distance_from_selected.has(n.node_id) ? -1024 : -8)

    data.simulation.force('link_direction')
        .y((n) => window.innerHeight * (
            selected === n.node_id
            ? 0.5 
            : levels.level_by_node.has(n.node_id) && selected_level !== undefined
            ?  .5 + (selected_level === levels.level_by_node.get(n.node_id) 
                ? 0 
                : 0.25 * ((1 - Math.pow(0.5, Math.abs(selected_level - levels.level_by_node.get(n.node_id))))/(1 - 0.5)) // sum geometric series
                ) * Math.sign(selected_level - levels.level_by_node.get(n.node_id))
            : .9
        ));

    data.simulation.force('collide').radius(n => n.node_id === selected ? 64 : 32);


    data.simulation
        .alpha(0.6);
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
            selected_distance: Math.min(data.levels.distance_from_selected.get(e.to), data.levels.distance_from_selected.get(e.from))
        }));

    return {
        nodes,
        links
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
                }))  
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
        }

        requestAnimationFrame(() => dispatch(options.action, {key: ev.key.toLowerCase(), code: ev.code, ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, metaKey: ev.metaKey, target: ev.target}))
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

    const seen_set = new Set();

    const new_display_graph = {
        nodes: data.display_graph.nodes
            .filter(n => n.id !== node_id)
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
    if(data.node_id.endsWith('/out') || data.name.endsWith("/out")) {
        const node_id = data.node_id.endsWith('/out') ? data.node_id.substring(0, data.node_id.indexOf("/out")) : data.node_id;
        const name = data.name?.substring(0, data.name.indexOf("/out")) ?? node_id;

        const inside_nodes = [Object.assign({}, data.display_graph.nodes.find(n => n.id === data.node_id))];
        const inside_node_map = new Map();
        const dangling = new Set();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = [];

        const q = [inside_nodes[0].id];

        while(q.length > 0) {
            const n = q.shift();
            dangling.delete(n);

            if(n !== node_id && n !== node_id + "/out") {
                console.log(n);
                data.display_graph.edges.filter(ie => ie.from === n).forEach(ie => {
                    if(!inside_node_map.has(ie.to)) {
                        dangling.add(ie.to)
                    }
                });
            }

            data.display_graph.edges.filter(e => e.to === n).forEach(e => {
                const old_node = inside_nodes.find(n => n.id === e.from);
                let inside_node = old_node ?? data.display_graph.nodes.find(p => p.id === e.from);

                if(!inside_node) {
                    console.log('canceling loop');
                    return;
                }

                inside_node_map.set(inside_node.id, inside_node);

                inside_edges.push(e);
                if(!old_node) {
                    inside_nodes.push(inside_node);
                }

                if(!(e.from === (node_id + "/in") || inside_node.name === (name + "/in"))) {
                    q.push(e.from);
                }
            });
        }

        if(dangling.size > 0) {
            return undefined;
        }

        const in_node = inside_nodes.find(n => n.id === node_id + '/in' || n.name === name + "/in");
        const in_node_id = in_node?.id;

        if(in_node) {
            in_node.id = node_id + "/in";
            inside_node_map.set(in_node.id, in_node);
        }

        const out_node = inside_nodes.find(n => n.id === node_id || n.name === name + "/out" || n.id === node_id + "/out");
        const out_node_id = out_node.id;

        if(out_node) {
            out_node.id = node_id + "/out";
            inside_node_map.set(out_node.id, out_node);
        }


        const new_display_graph = {
                nodes: data.display_graph.nodes
                    .filter(n => n.id !== node_id)
                    .filter(n => keep_expanded || !inside_node_map.has(n.id))
                    .concat([{
                        id: node_id,
                        name,
                        nodes: inside_nodes.map(n => ({
                            ...n,
                            id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
                        })),
                        edges: inside_edges.map(e => ({...e, 
                            from: e.from.startsWith(node_id + "/") 
                            ? e.from.substring(node_id.length + 1) 
                            : e.from === in_node_id
                            ? "in"
                            : e.from, 
                            to: e.to.startsWith(node_id + "/") 
                                ? e.to.substring(node_id.length + 1) 
                                : e.to === out_node_id
                                ? "out"
                                : e.to
                        }))
                    }]),
                edges: data.display_graph.edges
                    .filter(e => keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to)))
                    .map(e => 
                        e.from === data.node_id ? {...e, from: node_id} 
                        : e.to === in_node_id ? {...e, to: node_id} 
                        : e)
            };

        return new_display_graph;
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
            flat_nodes: acc.flat_nodes.concat(n.flat_nodes?.flat() ?? []),
            flat_edges: acc.flat_edges.map(e => n.flat_nodes ?
                e.to === n.id ?
                Object.assign({}, e, { to: `${e.to}/in` }) :
                e.from === n.id ?
                Object.assign({}, e, { from: `${e.from}/out` }) :
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

const generic_nodes = new Set(["switch", "filter", "delete", "default", "trigger", "execute_graph", "get"])

const stored = localStorage.getItem("display_graph");
const display_graph = stored ? JSON.parse(stored) : test_graph;
const state = new Map([['in', [{graph: DEFAULT_GRAPH, display_graph: {nodes: display_graph.nodes.concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id) && display_graph.nodes.findIndex(dn => dn.id === n.id) === -1)), edges: display_graph.edges.concat([])}, display_graph_out: "out"}]]])

console.log(executeGraph({state, graph: DEFAULT_GRAPH, out: "hyperapp_app"})[0]);
