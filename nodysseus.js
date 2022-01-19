import DEFAULT_GRAPH from "./pull.json"
import get from "just-safe-get";
import set from "just-safe-set";
import { diff } from "just-diff";
import diffApply from "just-diff-apply";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";

function compare(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */
    // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if(value1?._Proxy && value2?._Proxy) {
        return value1._nodeid === value2._nodeid;
    }
    if ({}.toString.call(value1) != {}.toString.call(value2)) {
        return false;
    }
    if (value1 !== Object(value1)) {
        // non equal primitives
        return false;
    }
    if (!value1) {
        return false;
    }
    if (Array.isArray(value1)) {
        return compareArrays(value1, value2);
    }
    if ({}.toString.call(value1) == '[object Set]') {
        return compareArrays(Array.from(value1), Array.from(value2));
    }
    if ({}.toString.call(value1) == '[object Map]') {
        return compareArrays([...value1.entries()], [...value2.entries()]);
    }
    if ({}.toString.call(value1) == '[object Object]') {
        return compareObjects(value1, value2);
    } else {
        return compareNativeSubtypes(value1, value2);
    }
}

function compareNativeSubtypes(value1, value2) {
    // e.g. Function, RegExp, Date
    return value1.toString() === value2.toString();
}

function compareArrays(value1, value2) {
    var len = value1.length;
    if (len != value2.length) {
        return false;
    }
    var alike = true;
    for (var i = 0; i < len; i++) {
        if (!compare(value1[i], value2[i])) {
            alike = false;
            break;
        }
    }
    return alike;
}

function compareObjects(value1, value2) {
    var keys1 = Object.keys(value1);
    var keys2 = Object.keys(value2);
    var len = keys1.length;
    if (len != keys2.length) {
        return false;
    }
    if(value1._needsresolve || value2._needsresolve) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var key1 = keys1[i];
        // var key2 = keys2[i];
        if(value1[key1] !== value2[key1]) {
            return false;
        }
        // if (!(compare(value1[key1], value2[key1]))) {
        //     return false;
        // }
    }
    return true;
}


function compareMaps(value1, value2) {
    if (value1.size !== value2.size) {
        return false;
    }


}

const hashcode = function(s) {
  var hash = 0, i, chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr   = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

const executeGraph = ({ cache, state, graph, globalstate, cache_id, node_cache }) => {
    let usecache = true;

    if (!cache.has(cache_id)) {
        cache.set(cache_id, new Map([["__handles", 1]]));
    } else {
        cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
    }

    if(!graph.nodes) {
        debugger;
    }

    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    const in_edge_map = graph.in_edge_map ?? new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)]));
    graph.in_edge_map = in_edge_map;

    const run_with_val = (node_id) => (graph_input_value) => {
        const tryrun = (input) => {
            if(input.type === "ref") {
                return input.from;
            } else if(input.from === "_graph_input_value" || input.from === graph.in){
                return graph_input_value;
            } else if(input.type === "resolve") {
                return resolve_new(run_with_val(input.from)(graph_input_value));
            }else if(!input.as || node_type.script) {
                let res = run_with_val(input.from)(graph_input_value);

                if(res?._Proxy) {
                    return res._value;
                }

                return res;
            } else {
                let res;
                return new Proxy({}, {
                    get: (_, prop) => {
                        if(prop === "_Proxy") {
                            return true;
                        } else if(prop === "_nodeid") {
                            return input.from;
                        }

                        if(res === undefined) {
                            res = run_with_val(input.from)(graph_input_value);
                        }

                        if(prop === "_value") {
                            return res
                        } else {
                            return res[prop];
                        }
                    },
                    ownKeys: (_) => {
                        if(res === undefined) {
                            res = run_with_val(input.from)(graph_input_value);
                        }

                        return Reflect.ownKeys(res);
                    },
                    getOwnPropertyDescriptor: (_, prop) => {
                        if(res === undefined) {
                            res = run_with_val(input.from)(graph_input_value);
                        }

                        return Reflect.getOwnPropertyDescriptor(res, prop);
                    }
                })
                // {type: "ref", node: node_map.get(input.from), _needsresolve: true}
            }
        }

        const resolve_new = (o) => {
            if(o?._Proxy){
                return resolve_new(o._value)
            } else if(Array.isArray(o)) {
                return o.map(v => resolve_new(v));
            } else if(typeof o === 'object' && o) {
                return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, resolve_new(v)]));
            } else {
                return o;
            }
        }

        if(!node_map.has(node_id)) {
            debugger;
        }



        let node = Object.assign({}, node_map.get(node_id), {inputs: in_edge_map.get(node_id)});

        if(node.type === "arg" && (!node.inputs || node.inputs.length === 0)) {
            node.inputs.push({from: "_graph_input_value", to: node.id});
        }

        if(node.value && !node.script && !node.type) {
            return node.value;
        }

        let node_type;
        let node_from_cache = false;
        let cached_node = node.script ? node_cache.get(hashcode(node.id + node.script.substring(node.script.length * 0.5 - 16, node.script.length * 0.5 + 16))) : false

        if (cached_node) {
            node_from_cache = true;
            node = cached_node;
        }

        const type = node.type?.node_type ?? typeof node.type === 'string' ? node.type : undefined;
        if(!node_from_cache && type) {
            const node_map_type = node_map.get(type);
            if(node_map_type) {
                node_type = Object.assign({}, node_map_type, node)
                node_type.args = (node.args ?? []).concat(node_map_type.args);
                node_type._nodetypeflag = !!node._nodetypeflag;
            } else {
                throw new Error(`Unable to find type ${type} for node ${node.name ?? node.id}`)
            }
        } else {
            node_type = node;
        }

        const input_data_map = new Map(node.inputs.map(i => [i.from, tryrun(i)]));
        const inputs = node.inputs;
        const data = {};
        let input;

                    // grab inputs from state
                    for (let i = 0; i < inputs.length; i++) {
                        input = inputs[i];
                        
                        if (input.type === "ref") {
                            if (!input.as) {
                                throw new Error("references have to be named: " + node.id);
                            }
                            data[input.as] = input.from;
                        } else {
                            // let should_resolve = input.type === "resolve";
                            // let should_get = node.script || !input.as;

                            // let state_data = should_resolve || should_get 
                            //     ? input_data_map.get(input.from)
                            //     : { _needsresolve: true, type: "ref", node: node_map.get(input.from) };
                            let state_data = input_data_map.get(input.from);

                            // if(!input.as && state_data === undefined) {
                            //     // if the input is * and undefined, just move on
                            //     continue;
                            // }

                            // // if(should_get) {
                            // //     while (state_data?.type === "ref") {
                            // //         state_data = stateget(state_data.node.id);
                            // //     }
                            // // }

                            // if (!(inputs.length === 1 || input.as || (typeof state_data === 'object' && !Array.isArray(state_data)))) {
                            //     throw new Error("can only interpolate objects with other inputs: " + node.id);
                            // }

                            if (input.as) {
                                // data._needsresolve = !!data._needsresolve || !!state_data?._needsresolve;
                                data[input.as] = state_data;
                            } else if(state_data !== undefined) {
                                Object.assign(data, state_data)//, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
                            }
                        }
                    }
        
            if(node_type.nodes) {
                                
                const inid = `${node.id}/${node_type.in ?? 'in'}` ;
                        let hit = false;
                            if (!node_map.has(`${node.id}/${node_type.out ?? 'out'}`)) {
                                for (let i = 0; i < node_type.edges.length; i++) {
                                    const new_edge = Object.assign({}, node_type.edges[i]);
                                    new_edge.from = `${node.id}/${new_edge.from}`;
                                    new_edge.to = `${node.id}/${new_edge.to}`;
                                    graph.edges.push(new_edge);
                                    in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                                }

                                for (const child of node_type.nodes) {
                                    const new_node = Object.assign({}, child);
                                    new_node.id = `${node.id}/${child.id}`;
                                    graph.nodes.push(new_node)
                                    node_map.set(new_node.id, new_node);
                                    const has_inputs = in_edge_map.has(new_node.id);
                                    if(new_node.id === `${node.id}/${node_type.in ?? 'in'}`) {
                                        graph.edges.forEach(e => e.to = e.to === node.id ?  `${node.id}/${node_type.in ?? 'in'}` : e.to);
                                        in_edge_map.set(new_node.id, graph.edges.filter(e => e.to === `${node.id}/${node_type.in ?? 'in'}` ))
                                            // .concat([{from: "_graph_input_value", to: `${node.id}/${node_type.in ?? 'in'}`}]));
                                    } else if (!has_inputs 
                                        && (
                                            new_node.type === "arg" 
                                            // || new_node.nodes 
                                            // || (new_node.type && node_map.get(new_node.type).nodes)
                                        )) {
                                        const new_edge = { from: `${node.id}/${node_type.in ?? 'in'}`, to: new_node.id };
                                        in_edge_map.set(new_node.id, [new_edge])
                                        graph.edges.push(new_edge);
                                    } else if(!has_inputs){
                                        in_edge_map.set(new_node.id, []);
                                        new_node.inputs = [];
                                    }
                                }
                            }

                    const ntargs = node_type.args ?? [];
                    const args = new Map([
                                ntargs.includes('node_inputs') && ['node_inputs', data]
                                ].filter(v => v))
                            inputs.forEach(input => {
                                if (input.as && !keywords.has(input.as) && args.has(input.as)) {
                                    args.set(input.as, data[input.as]);
                                }
                            });

                            if (ntargs) {
                                ntargs.forEach(arg => {
                                    if (!keywords.has(arg) && arg !== 'node_inputs') {
                                        // while(data[arg]?.type === "ref") {
                                        //     data[arg] = run_with_val(data[arg].node.id)(graph_input_value);
                                        // }
                                        while(data[arg]?._Proxy){
                                            data[arg] = data[arg]._value;
                                        }
                                        args.set(arg, data[arg]);
                                    }
                                })
                            }

                    if(node_map.has( `${node.id}/${node_type.in ?? 'in'}`)) {
                            node_map.get( `${node.id}/${node_type.in ?? 'in'}`).value = 
                                typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) ? Object.assign({}, graph_input_value, data) : data;
                    }

                    if (usecache && cache.get(cache_id).has(inid)) {
                        const val = cache.get(cache_id).get(inid);
                        hit = compare(val[1], args);
                        hit = hit && compare(val[2], graph_input_value);
                        if (hit) {
                            return val[0];
                        }
                    }

                    const res = run_with_val(`${node.id}/${node_type.out ?? 'out'}`)(graph_input_value)
					cache.get(cache_id).set(inid, [res, data, graph_input_value]);
					return res;
            } else if (node_type.script) {
                    const args = new Map([['lib', lib],
                                ['node', node],
                                node_type.args.includes('node_inputs') && ['node_inputs', data]
                                ].filter(v => v))
                            inputs.forEach(input => {
                                if (input.as && !keywords.has(input.as) && args.has(input.as)) {
                                    args.set(input.as, data[input.as]);
                                }
                            });

                            if (node_type.args) {
                                node_type.args.forEach(arg => {
                                    if (!keywords.has(arg) && arg !== 'node_inputs') {
                                        while(data[arg]?._Proxy) {
                                            data[arg] = data[arg]._value;
                                        }
                                        args.set(arg, data[arg]);
                                    }
                                })
                            }
                                if (usecache && cache.get(cache_id).has(node.id)) {
                                    const val = cache.get(cache_id).get(node.id);
                                    let hit = usecache;
                                    args.forEach((v, k) => hit = hit && (k === 'node_inputs' || k === 'lib' || k === 'node' || compare(val[1].get(k), v)));
                                    hit = hit && compare(graph_input_value, val[2]);
                                    if (hit) {
                                        // console.log(input_results);
                                        // console.log("hit");
										return val[0]
                                    }
                                }

                            // if (usecache && cache.get(cache_id).has(node.id)) {
                            //     const val = cache.get(cache_id).get(node.id);
                            //     let hit = usecache;
                            //     input_results.forEach((v, i) => hit = hit && compare(val[1]?.[i]?.[1], v[1]));
                            //     args.forEach((v, k) => hit = hit && (k === 'node_inputs' || k === 'lib' || k === 'node' || compare(val[2].get(k), v)));
                            //     if (hit) {
                            //         // console.log(input_results);
                            //         // console.log("hit for " + node.id)
                            //         // console.log("hit");
                            //         state.set(node.id, val[0]);
                            //         active_nodes.delete(node.id);
                            //         continue;
                            //     }
                            // }


                            try {
                                    const fn = node_type.fn ?? new Function(`return function _${(node.name ?? node.id).replace(/(\s|\/)/g, '_')}(${[...args.keys()].join(',')}){${node_type.script}}`)()
                                    node_type.fn = fn;

                                    node_cache.set(hashcode(node.id + node_type.script.substring(node_type.script.length * 0.5 - 16, node_type.script.length * 0.5 + 16)), node_type);

                                    const results = fn.apply(null, [...args.values()]);

                                    // Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
                                    // state.set(node.id, results);
                                    // don't cache things without arguments
                                    if (node_type.args?.length > 0){
										cache.get(cache_id).set(node.id, [results, args, graph_input_value]);
                                    }


                                        return results;
                                    // active_nodes.delete(node.id);
                            } catch (e) {
                                console.log(`error in node`);
                                console.error(e);
                                console.dir(node_type);
                                console.log(state);
                                throw new AggregateError([Error(`Error in node ${node_type.name ?? node_type.id}`)].concat(e instanceof AggregateError ? e.errors : [e]));
                            }
            }

            return data;
    }

    return run_with_val(graph.out);
}
        
// const old = () => {
//         // console.log(graph_input_value);
//         if(state !== globalstate) {
//             state = new Map(state);
//         }
//         // console.log(state);

//         const statehas = (k) => state.has(k) || globalstate.has(k);
//         const stateget = (k) => state.has(k) ? state.get(k) : globalstate.has(k) ? globalstate.get(k) : undefined;

//         const active_nodes = new Map([[out, Object.assign({}, graph.nodes.find(n => n.id === out), {
//             inputs: in_edge_map.get(out)
//         })]]);

//         while (!state.has(out)) {

//             if (!skip_stuck_test && state_length === state.size && active_nodes_length === active_nodes.size) {
//                 console.log(graph);
//                 console.log(state);
//                 console.log(active_nodes);
//                 throw new Error(`stuck with active: ${[...active_nodes.keys()].join(', ')} and state: ${[...state.keys()].join(', ')}`);
//             }


//             skip_stuck_test = false;

//             state_length = state.size;
//             active_nodes_length = active_nodes.size;

//             let input;
//             let node;
//             let active_node_vals = [...active_nodes.values()];
//             const l = active_node_vals.length;

//             for (let i = 0; i < l; i++) {
//                 node = active_node_vals[i];
//                 if (!node.id) {
//                     throw new Error("undefined node.id");
//                 }


//                 if (state.get(node.id)?.type === "ref" && state.get(state.get(node.id).node.id)) {
//                     console.log('ref found ' + node.id)
//                     state.set(node.id, state.get(state.get(node.id).node.id));
//                     active_nodes.delete(node.id);
//                     continue;
//                 }

//                 let run = true;

//                 // get the node from node_cache if it's there and up to date
//                 let node_from_cache = false;
//                 let cached_node = node.script ? node_cache.get(hashcode(node.id + node.script)) : false
//                 if (cached_node) {
//                     node_from_cache = true;
//                     node = cached_node;
//                 }

//                 // resolve the type of the node
//                 const type = node.type?.node_type ?? typeof node.type === 'string' ? node.type : undefined;
//                 const resolved_type = type ? "type" : node.script ? "script" : node.value ? "value" : undefined;
//                 let node_type;

//                 if(!node_from_cache && type) {
//                     const node_map_type = node_map.get(type);
//                     if(node_map_type) {
//                         node_type = Object.assign({}, node_map_type, node)
//                         node_type.args = (node.args ?? []).concat(node_map_type.args);
//                         node_type._nodetypeflag = !!node._nodetypeflag;
//                     } else {
//                         throw new Error(`Unable to find type ${type} for node ${node.name ?? node.id}`)
//                     }
//                 } else {
//                     node_type = node;
//                 }

//                 // check if we have all the inputs
//                 let inputs = node.hasOwnProperty("inputs") ? (node.inputs ?? []) : [{from: "_graph_input", to: node.id}];
//                 const input_data_map = new Map();

//                 for (let i = 0; i < inputs.length; i++) {
//                     input = inputs[i];

//                     if ((node_type.script && input.as && !node_type.args.includes(input.as))) {
//                         continue;
//                     }

//                     if (input.type === "ref") {

//                     } else if(input.from === "_graph_input"){
//                         input_data_map.set(input.from, graph_input_value);
//                     } else if (input.type === "resolve") {
//                         if (statehas(input.from)) {
//                             let [res, resolved] = resolve(stateget(input.from), state, active_nodes, node_map, statehas, stateget, in_edge_map);

//                             run = run && resolved;
//                             if(run) {
//                                 input_data_map.set(input.from, res);
//                             }
//                         } else if(!active_nodes.has(input.from)) {
//                             run = false;
//                             const input_node = node_map.get(input.from);

//                             if (input_node === undefined) {
//                                 throw new Error(`Can't find input ${input.from} for node ${node.id}`);
//                             }

//                             active_nodes.set(input.from, Object.assign({
//                                 inputs: in_edge_map.get(input.from)
//                             }, input_node));
//                         } else {
//                             run = false;
//                         }
//                     } else if (!input.as || node.script) {
//                         if(!statehas(input.from)){
//                             run = false;

//                             if (!active_nodes.has(input.from)) {
//                                 const input_node = node_map.get(input.from);

//                                 if (input_node === undefined) {
//                                     throw new Error(`Can't find input ${input.from} for node ${node.id}`);
//                                 }

//                                 active_nodes.set(input.from, Object.assign({
//                                     inputs: in_edge_map.get(input.from)
//                                 }, input_node));
//                             }
//                         } else {
//                             let input_data = state.get(input.from);

//                             while (input_data?.type === "ref" && statehas(input_data.node.id)) {
//                                 input_data = stateget(input_data.node.id);
//                             }

//                             if(input_data?.type === "ref") {
//                                 run = false;

//                                 if(!active_nodes.has(input_data.node.id)) {
//                                     active_nodes.set(input_data.node.id, Object.assign({}, node_map.get(input_data.node.id), {
//                                         inputs: in_edge_map.get(input_data.node.id)
//                                     }));
//                                 }
//                             } else {
//                                 input_data_map.set(input.from, input_data);
//                             }
//                         }
//                     }
//                 }

//                 if (run) {
//                     let data = {};

//                     if (node_type.value !== undefined && !node_type.script) {
//                         if (usecache && cache.get(cache_id).has(node.id)) {
//                             state.set(node.id, cache.get(cache_id).get(node.id))
//                         } else {
//                             state.set(node.id, node.value);
//                             cache.get(cache_id).set(node.id, node.value)
//                         }
//                         active_nodes.delete(node.id);
//                     } else {
//                         if (!node_from_cache) {
//                             inputs.sort((a, b) =>
//                                 a.as && !b.as
//                                     ? 1
//                                     : !a.as && b.as
//                                         ? -1
//                                         : a.order !== undefined && b.order !== undefined
//                                             ? a.order - b.order
//                                             : a.order !== undefined
//                                                 ? a.order
//                                                 : b.order !== undefined
//                                                     ? b.order
//                                                     : 0
//                             );
//                         }

//                         let input;
//                         const input_results = [];

//                         // grab inputs from state
//                         for (let i = 0; i < inputs.length; i++) {
//                             input = inputs[i];
                            
//                             if (input.type === "ref") {
//                                 if (!input.as) {
//                                     throw new Error("references have to be named: " + node.id);
//                                 }
//                                 input_results.push([input.as, input.from]);
//                                 data[input.as] = input.from;
//                             } else {
//                                 let should_resolve = input.type === "resolve";
//                                 let should_get = node.script || !input.as;

//                                 let state_data = should_resolve || should_get 
//                                     ? input_data_map.get(input.from)
//                                     : { _needsresolve: true, type: "ref", node: node_map.get(input.from) };

//                                 if(!input.as && state_data === undefined) {
//                                     // if the input is * and undefined, just move on
//                                     continue;
//                                 }

//                                 // if(should_get) {
//                                 //     while (state_data?.type === "ref") {
//                                 //         state_data = stateget(state_data.node.id);
//                                 //     }
//                                 // }

//                                 if (!(inputs.length === 1 || input.as || (typeof state_data === 'object' && !Array.isArray(state_data)))) {
//                                     throw new Error("can only interpolate objects with other inputs: " + node.id);
//                                 }

//                                 if (input.as) {
//                                     data._needsresolve = !!data._needsresolve || !!state_data?._needsresolve;
//                                     data[input.as] = state_data;
//                                 } else {
//                                     Object.assign(data, state_data, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
//                                 }

//                                 input_results.push([input.as, input.as ? data[input.as] : data]);
//                             }
//                         }

//                         if (node_type.nodes && node_type.edges) {
//                             if (!state.has(node.id + "/" + (node_type.in ?? 'in'))) {
//                                 const inid = node.id + "/" + (node_type.in ?? 'in');
//                                 let hit = false;
//                                 if (usecache && cache.get(cache_id).has(inid)) {
//                                     const val = cache.get(cache_id).get(inid);
//                                     hit = compare(val, data);
//                                     if (hit) {
//                                         state.set(inid, val);
//                                     }
//                                 }

//                                 if (!hit) {
//                                     state.set(inid, data);
//                                     cache.get(cache_id).set(inid, data);
//                                 }
//                             }


//                             if (state.has(`${node.id}/${node_type.out ?? 'out'}`)) {
//                                 // state.delete(state.get(`${node.id}/${node_type.out ?? 'out'}`));
//                                 state.set(node.id, state.get(`${node.id}/${node_type.out ?? 'out'}`))
//                                 active_nodes.delete(node.id);
//                             } else {
//                                 if (!node_map.has(`${node.id}/${node_type.out ?? 'out'}`)) {
//                                     for (let i = 0; i < node_type.edges.length; i++) {
//                                         const new_edge = Object.assign({}, node_type.edges[i]);
//                                         new_edge.from = `${node.id}/${new_edge.from}`;
//                                         new_edge.to = `${node.id}/${new_edge.to}`;
//                                         graph.edges.push(new_edge);
//                                         in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
//                                     }

//                                     for (const child of node_type.nodes) {
//                                         const new_node = Object.assign({}, child);
//                                         new_node.id = `${node.id}/${child.id}`;
//                                         graph.nodes.push(new_node)
//                                         node_map.set(new_node.id, new_node);
//                                         const has_inputs = in_edge_map.has(new_node.id);
//                                         if(new_node.id === `${node.id}/${node_type.in ?? 'in'}`) {
//                                             graph.edges.forEach(e => e.to = e.to === node.id ?  `${node.id}/${node_type.in ?? 'in'}` : e.to);
//                                             in_edge_map.set(new_node.id, graph.edges.filter(e => e.to === `${node.id}/${node_type.in ?? 'in'}` ));
//                                         } else if (!has_inputs 
//                                             && (
//                                                 new_node.type === "arg" 
//                                                 || new_node.nodes 
//                                                 || (new_node.type && node_map.get(new_node.type).nodes)
//                                             )) {
//                                             const new_edge = { from: `${node.id}/${node_type.in ?? 'in'}`, to: new_node.id };
//                                             in_edge_map.set(new_node.id, [new_edge])
//                                             new_node.inputs = [new_edge];
//                                             graph.edges.push(new_edge);
//                                         } else if(!has_inputs){
//                                             new_node.inputs = [];
//                                         }
//                                     }
//                                 }

//                                 // idk why this has to be true, but otherwise it doesn't work
//                                 skip_stuck_test = true; // active_nodes[node_id] changed but the size didn't

//                                 if (!active_nodes.has(`${node.id}/${node_type.out ?? 'out'}`)) {
//                                     active_nodes.set(`${node.id}/${node_type.out ?? 'out'}`, Object.assign(
//                                         node_map.get(`${node.id}/${node_type.out ?? 'out'}`), {
//                                         inputs: in_edge_map.get(`${node.id}/${node_type.out ?? 'out'}`)
//                                     }
//                                     ));
//                                 }
//                             }

//                         } else if (node_type.script) {
//                                 const args = new Map([['lib', lib],
//                                 ['node', node],
//                                 node_type.args.includes('node_inputs') && ['node_inputs', Object.fromEntries(input_results.flatMap(r => r[0] ? [r] : Object.entries(r[1])))]
//                                 ].filter(v => v));

//                                 // order matters
//                                 // the function bs is for debugging purposes
//                                 let done = true;

//                                 node_type.args.forEach(arg => {
//                                     if (!args.has(arg)) {
//                                         args.set(arg, null);
//                                     }


//                                     if (!keywords.has(arg) && data[arg]?.type === "ref") {
//                                         while (data[arg]?.type === "ref") {
//                                             if (statehas(data[arg]?.node.id)) {
//                                                 data[arg] = stateget(data[arg]?.node.id);
//                                             } else {
//                                                 break;
//                                             }
//                                         }


//                                         if (data[arg]?.type === "ref") {
//                                             done = false;
//                                             const input_node = data[arg]?.node;

//                                             if (input_node === undefined) {
//                                                 throw new Error(`Can't find input ${data[arg]?.node} for node ${node.id}`);
//                                             }

//                                             if (!active_nodes.has(data[arg].node.id)) {
//                                                 active_nodes.set(data[arg].node.id, Object.assign({}, input_node, {
//                                                     inputs: in_edge_map.get(data[arg].node.id)
//                                                 }));
//                                             }
//                                         }
//                                     }
//                                 })

//                                 if (done) {
//                                     inputs.forEach(input => {
//                                         if (input.as && !keywords.has(input.as) && args.has(input.as)) {
//                                             args.set(input.as, data[input.as]);
//                                         }
//                                     });

//                                     if (node_type.args) {
//                                         node_type.args.forEach(arg => {
//                                             if (!keywords.has(arg) && arg !== 'node_inputs') {
//                                                 args.set(arg, data[arg]);
//                                             }
//                                         })
//                                     }

//                                     if (usecache && cache.get(cache_id).has(node.id)) {
//                                         const val = cache.get(cache_id).get(node.id);
//                                         let hit = usecache;
//                                         input_results.forEach((v, i) => hit = hit && compare(val[1]?.[i]?.[1], v[1]));
//                                         args.forEach((v, k) => hit = hit && (k === 'node_inputs' || k === 'lib' || k === 'node' || compare(val[2].get(k), v)));
//                                         if (hit) {
//                                             // console.log(input_results);
//                                             // console.log("hit for " + node.id)
//                                             // console.log("hit");
//                                             state.set(node.id, val[0]);
//                                             active_nodes.delete(node.id);
//                                             continue;
//                                         }
//                                     }

//                                     try {
//                                             const fn = node_type.fn ?? new Function(`return function _${(node.name ?? node.id).replace(/(\s|\/)/g, '_')}(${[...args.keys()].join(',')}){${node_type.script}}`)()
//                                             node_type.fn = fn;

//                                             node_cache.set(hashcode(node.id + node.script), node_type);

//                                             const results = fn.apply(null, [...args.values()]);

//                                             // Array.isArray(results) ? results.forEach(res => state_datas.push(res)) : state_datas.push(results);
//                                             state.set(node.id, results);
//                                             // don't cache things without arguments
//                                             if (node_type.args?.length > 0){
//                                                     cache.get(cache_id).set(node.id, [results, input_results, args]);
//                                             }
//                                             active_nodes.delete(node.id);
//                                     } catch (e) {
//                                         console.log(`error in node`);
//                                         console.error(e);
//                                         console.dir(node_type);
//                                         console.log(state);
//                                         throw new AggregateError([Error(`Error in node ${node_type.name ?? node_type.id}`)].concat(e instanceof AggregateError ? e.errors : [e]));
//                                     }
//                                 }
//                         } else {
//                             if (cache.get(cache_id).has(node.id)) {
//                                 const val = cache.get(cache_id).get(node.id);
//                                 let hit = usecache && compare(val, data);
//                                 if (hit) {
//                                     // console.log("hit for " + node.id)
//                                     state.set(node.id, val);
//                                     active_nodes.delete(node.id);
//                                     continue;
//                                 }
//                             }

//                             state.set(node.id, data);
//                             if (node.args?.length > 0){
//                                 cache.get(cache_id).set(node.id, data);
//                             }
//                             active_nodes.delete(node.id);
//                         }
//                     }
//                 }
//             }
//         }

//         const handles = cache.get(cache_id).get("__handles");
//         if (handles === 1 && cache_id === "temp") {
//             cache.delete(cache_id);
//         } else {
//             cache.get(cache_id).set("__handles", handles - 1);
//         }



//         return state;
//     }
// };

const test_graph = {
    "in": "/in",
    "out": "/out",
    "nodes": [
        {
            "id": "/out",
            "args": ["value"],
            "script": "return value;"
        },
        { "id": "/in" }
    ],
    "edges": [
        { "from": "/in", "to": "/out" }
    ]
}

//////////
// TODO: convert these to nodes

const calculateLevels = (graph, selected, fixed_vertices) => {
    const find_childest = n => {
        const e = graph.edges.find(e => e.from === n);
        if (e) {
            return find_childest(e.to);
        } else {
            return n;
        }
    }
    selected = selected[0];
    const top = find_childest(selected);

    const levels = new Map();
    bfs(graph, levels)(top, 0);

    const parents = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id).map(e => e.from)]));
    const children = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.from === n.id).map(e => e.to)]));
    const siblings = new Map(graph.nodes.map(n => [n.id, [...(new Set(/*parents.get(n.id)?.flatMap(p => children.get(p)?.filter(c => c !== n.id) ?? []).concat(*/children.get(n.id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values()/*)*/]]))
    const distance_from_selected = new Map();

    const connected_vertices = new Map(); //new Map(!fixed_vertices ? [] : fixed_vertices.nodes.flatMap(v => (v.nodes ?? []).map(n => [n, v.nodes])));

    const calculate_selected_graph = (s, i, c) => {
        const id = c || children.get(s)?.length > 0 ? (s + "_" + (c ?? children.get(s)[0])) : s;
        if (distance_from_selected.get(id) <= i) {
            return;
        }

        distance_from_selected.set(id, i);
        parents.get(s)?.forEach(p => { calculate_selected_graph(p, i + 1, s); });
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

    for (const e of graph.edges) {
        if (e.to === id) {
            next(e.from, level + 1);
        }
    }
}

let simulation;

const d3simulation = () => {
    if(!simulation) {
        simulation =
            lib.d3.forceSimulation()
                .force('charge', lib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(128))
                .force('collide', lib.d3.forceCollide(64))
                .force('links', lib.d3
                    .forceLink([])
                    .distance(128)
                    .strength(l => l.strength)
                    .id(n => n.node_child_id))
                .force('link_direction', lib.d3.forceY().strength(.05))
                .force('center', lib.d3.forceCenter())
                // .force('fuse_links', lib.d3.forceLink([]).distance(128).strength(.1).id(n => n.node_child_id))
                // .force('link_siblings', lib.d3.forceX().strength(1))
                // .force('selected', lib.d3.forceRadial(0, window.innerWidth * 0.5, window.innerHeight * 0.5).strength(2))
                // .velocityDecay(0.6)
                .alphaMin(.125);
    }

    return simulation;
}

const updateSimulationNodes = (data) => {
    const selected = data.selected[0];
    const levels = data.levels ?? calculateLevels(data.display_graph, data.display_graph.out);
    const selected_level = levels.level_by_node.get(selected);

    if (typeof (data.links?.[0]?.source) === "string") {
        if (
            data.simulation.nodes()?.length !== data.nodes.length ||
            data.simulation.force('links')?.links().length !== data.links.length) {
            data.simulation.alpha(0.4);
        }

        data.simulation.nodes(data.nodes);
        data.simulation.force('links').links(data.links);
        // data.simulation.force('fuse_links').links(data.fuse_links);
        // console.log(data.simulation);
    }

    const sibling_x = new Map();
    const selected_x = ((levels.nodes_by_level[selected_level].findIndex(l => l === selected) + 1)
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
            (((levels.parents.get(n.node_id)?.length > 0 ? 1 : 0)
                + (levels.children.get(n.node_id)?.length > 0 ? -1 : 0)
                + (levels.children.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + levels.children.get(n.node_id)[0] ? -1 : 0))
                * 8 + .5) * window.innerHeight)
        .strength(n => (!!levels.parents.get(n.node_id)?.length === !levels.children.get(n.node_id)?.length)
            || levels.children.get(n.node_id)?.length > 0 && n.node_child_id !== n.node_id + "_" + levels.children.get(n.node_id)[0] ? .025 : 0);


    data.simulation.force('collide').radius(64);
    // data.simulation.force('center').strength(n => (levels.parents.get(n.node_id)?.length ?? 0) * 0.25 + (levels.children.get(n.node_id)?.length ?? 0) * 0.25)

    // console.log(data.links)

}

const graphToSimulationNodes = (data) => {
    const simulation_node_data = new Map();
    data.nodes.forEach(n => {
        simulation_node_data.set(n.node_child_id, n)
    });

    const main_node_map = new Map();

    const fuse_links = [];

    const nodes = data.display_graph.nodes.flatMap(n => {
        const children = data.levels.children.get(n.id);
        main_node_map.set(n.id, children.length > 0 ? n.id + "_" + children[0] : n.id);

        return children.length === 0 ? [{
            node_id: n.id,
            node_child_id: n.id,
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
            x: Math.floor(simulation_node_data.get(n.id)?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25))),
            y: Math.floor(simulation_node_data.get(n.id)?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25)))
        }] : children.map(c => ({
            node_id: n.id,
            node_child_id: n.id + "_" + c,
            type: n.type,
            nodes: n.nodes,
            edges: n.edges,
            script: n.script,
            value: n.value,
            name: n.name,
            in: n.in,
            out: n.out,
            level: data.levels.level_by_node.get(n.id),
            selected_distance: data.levels.distance_from_selected.get(n.id + "_" + c),
            x: Math.floor(simulation_node_data.get(n.id + "_" + c)?.x ?? data.x ?? Math.floor(window.innerWidth * (Math.random() * .5 + .25))),
            y: Math.floor(simulation_node_data.get(n.id + "_" + c)?.y ?? data.y ?? Math.floor(window.innerHeight * (Math.random() * .5 + .25)))
        }));
    })

    const links = data.display_graph.edges
        .filter(e => e.to !== "log" && e.to !== "debug")
        .map(e => ({
            source: e.from + "_" + e.to,
            target: main_node_map.get(e.to),
            as: e.as,
            type: e.type,
            strength: 4,
            selected_distance: data.levels.distance_from_selected.get(main_node_map.get(e.to)) !== undefined ? Math.min(data.levels.distance_from_selected.get(main_node_map.get(e.to)), data.levels.distance_from_selected.get(e.from + "_" + e.to)) : undefined,
            sibling_index_normalized: (data.levels.siblings.get(e.from).findIndex(n => n === e.from) + 1) / (data.levels.siblings.get(e.from).length + 1),
        }));

    return {
        nodes,
        links,
        fuse_links
    }
}

const d3subscription = simulation => dispatch => {
    const abort_signal = { stop: false };
    simulation.stop();
    const tick = () => {
        if (simulation.alpha() > simulation.alphaMin()) {
            simulation.tick();
            dispatch(s => ({
                ...s,
                nodes: simulation.nodes().map(n => ({ ...n, x: Math.floor(n.x), y: Math.floor(n.y) })),
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

        requestAnimationFrame(() => dispatch((state, payload) => options.action(state, payload), { key: ev.key.toLowerCase(), code: ev.code, ctrlKey: ev.ctrlKey, shiftKey: ev.shiftKey, metaKey: ev.metaKey, target: ev.target }))
    };
    addEventListener('keydown', handler);
    return () => removeEventListener('keydown', handler);
}

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return {display_graph: data.display_graph, selected: [data.node_id]};
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

    return { display_graph: { ...display_graph, ...new_display_graph }, selected: [node_id + '/' + (node.out ?? 'out')] };
}

const contract_all = (graph) => {
    const node_ids = new Set(graph.nodes.map(n => n.id));
    let display_graph = graph;
    graph.nodes.forEach(g => {
        if (g.id.endsWith("/out") && !node_ids.has(g.id.substring(0, g.id.length - 4))) {
            display_graph = contract_node({ node_id: g.id, display_graph }, true);
        }
    })

    return display_graph;
}

const contract_node = (data, keep_expanded = false) => {
    const node = data.display_graph.nodes.find(n => n.id === data.node_id);
    if (!node.nodes) {
        const slash_index = data.node_id.lastIndexOf('/');
        const node_id = slash_index >= 0 ? data.node_id.substring(0, slash_index) : data.node_id;
        const name = data.name[0] ?? node_id;

        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        const dangling = new Set();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];

        while (q.length > 0) {
            const e = q.shift();
            dangling.delete(e.from);

            let this_dangling = 0;

            if (e.from !== data.node_id) {
                data.display_graph.edges.filter(ie => ie.from === e.from).forEach(ie => {
                    if (!inside_node_map.has(ie.to)) {
                        this_dangling += 1;
                        dangling.add(ie.to)
                    }
                });
            }

            if (this_dangling === 0) {


                in_edge.filter(ie => ie.from === e.from).forEach(ie => {
                    inside_edges.add(ie)
                });
                in_edge = in_edge.filter(ie => ie.from !== e.from);

                const old_node = inside_nodes.find(i => e.from === i.id);
                let inside_node = old_node ?? data.display_graph.nodes.find(p => p.id === e.from);

                if ((inside_node.name ?? inside_node.id)?.endsWith('/in') && !(inside_node.name ?? inside_node.id).endsWith(name + '/in')) {
                    in_edge.push(e);
                    continue;
                }

                inside_node_map.set(inside_node.id, inside_node);
                inside_edges.add(e);
                if (!old_node) {
                    inside_nodes.push(inside_node);
                }

                if (!inside_node.name?.endsWith(name + '/in')) {
                    data.display_graph.edges.filter(de => de.to === e.from).forEach(de => {
                        q.push(de);
                    });
                }

            } else {
                in_edge.push(e);
            }
        }

        let in_node_id = in_edge[0]?.to;

        if (in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node = inside_nodes.find(n => n.id === data.node_id || n.name === name + "/out" || n.id === node_id + "/out");
        const out_node_id = out_node.id;

        const in_node = inside_node_map.get(in_node_id);

        // have to create a dummy in node if the in node does something
        if (in_node_id && !in_node_id.endsWith('in')) {
            in_node_id = node_id + "/in";
            inside_nodes.push({ id: in_node_id });
            inside_edges.add({ from: in_node_id, to: in_node.id });
        }

        if (!in_node_id) {
            in_node_id = inside_nodes.find(n => n.id === node_id + "/in" || n.name === name + "/in")?.id;
        }

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
                    e.from === data.node_id ? { ...e, from: node_id }
                        : e.to === in_node?.id ? { ...e, to: node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: node_id }
                                : e
                )
        };

        return { display_graph: { ...display_graph, ...new_display_graph }, selected: [node_id] };
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
                if ((fn.id === prefix + (graph.out ?? "out")) && graph.name) {
                    fn.name = graph.name + "/out";
                } else if (graph.in && (fn.id === prefix + (graph.in ?? "/in")) && graph.name) {
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

const globalstate = new Map();
const cache = new Map();
const node_cache = new Map();

const lib = {
    just: { get, set, diff, diffApply },
    ha: { h, app, text, memo },
    no: { 
        executeGraph: ({ state, graph, cache_id }) => executeGraph({ cache, state, graph, globalstate, node_cache, cache_id: cache_id ?? "temp" })(state.get(graph.in)),
        executeGraphValue: ({ graph, cache_id }) => executeGraph({ cache, graph, globalstate, node_cache, cache_id: cache_id ?? "temp" })
    },
    scripts: { d3simulation, d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all },
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
    "array",
    "text",
    "text_display",
    "arg"
]);

const stored = localStorage.getItem("display_graph");
// const display_graph = {...DEFAULT_GRAPH, nodes: DEFAULT_GRAPH.nodes.map(n => ({...n})), edges: DEFAULT_GRAPH.edges.map(e => ({...e}))};
const display_graph = stored ? JSON.parse(stored) : test_graph;
const state = new Map([['in', { graph: DEFAULT_GRAPH, display_graph: { ...display_graph, nodes: display_graph.nodes.concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id) && display_graph.nodes.findIndex(dn => dn.id === n.id) === -1)), edges: display_graph.edges.concat([]) } }]])

state.forEach((v, k) => globalstate.set(k, v));

console.log(executeGraph({ cache, state: globalstate, graph: DEFAULT_GRAPH, out: "hyperapp_app", cache_id: "main", node_cache, globalstate })(state.get("in")));