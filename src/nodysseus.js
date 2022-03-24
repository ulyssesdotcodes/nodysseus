import DEFAULT_GRAPH from "../json/pull.json"
import get from "just-safe-get";
import set from "just-safe-set";
import { diff } from "just-diff";
import { diffApply } from "just-diff-apply";
import Fuse from "fuse.js";

function compare(value1, value2, keys) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */
    // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if (value1?._Proxy && value2?._Proxy) {
        return value1._nodeid === value2._nodeid;
    }
    if(typeof value1 !== typeof value2) {
        return false;
    }
    // if (value1 !== Object(value1)) {
    //     // non equal primitives
    //     return false;
    // }
    // if (!value1) {
    //     return false;
    // }
    if (Array.isArray(value1)) {
        return compareArrays(value1, value2);
    }
    if(typeof value1 === 'object' && typeof value2 === 'object') {
        if ((value1 instanceof Map) && (value2 instanceof Map)) {
            return compareArrays([...value1.entries()], [...value2.entries()]);
        }
        if ((value1 instanceof Set) && (value2 instanceof Set)) {
            return compareArrays(Array.from(value1), Array.from(value2));
        }

        return compareObjects(value1, value2, keys);
    }

    return compareNativeSubrefs(value1, value2);
}

function compareNativeSubrefs(value1, value2) {
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

function compareObjects(value1, value2, keys) {
    var keys1 = Object.keys(value1);
    var len = keys1.length;
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var key1 = keys1[i];
        // var key2 = keys2[i];
        if ((!!keys && !keys.includes(key1)) || value1[key1] === value2[key1]) {
            continue;
        }

        if(value1[key1]?._Proxy && value2[key1]?._Proxy 
            && value1[key1]._nodeid === value2[key1]._nodeid
            && compare(value1[key1]._graph_input_value, value2[key1]._graph_input_value)
            ) {
            continue;
        }

        return false;

        // if (!(compare(value1[key1], value2[key1]))) {
        //     return false;
        // }
    }
    return true;
}

const hashcode = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    let i = str.length, ch;
    while(i > 0){
        i--;
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};

const createProxy = (run_with_val, input, graph_input_value) => { 
    let res = Object.create(null);
    let resolved = false;
    return new Proxy(res, {
    get: (_, prop) => {
        if (prop === "_Proxy") {
            return true;
        } else if (prop === "_nodeid") {
            return input.from;
        } else if (prop === "_graph_input_value") {
            return graph_input_value;
        } 
        
        if (prop === 'toJSON') {
            return () => resolved ? res : {Proxy: input.from}
        }

        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }


        if (prop === "_value") {
            return res
        } else if(!res) {
            return res;
        } else {
            if(typeof res[prop] === 'function'){
                return res[prop].bind(res);
            } else {
                return res[prop];
            }
        }
    },
    ownKeys: (_) => {
        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }

        return typeof res === 'object' ? Reflect.ownKeys(res) : undefined;
    },
    getOwnPropertyDescriptor: (target, prop) => {
        if (!resolved) {
            res = run_with_val(input.from)(graph_input_value);
            resolved = true;
        }

        return typeof res === 'object' && !!res ? (Reflect.getOwnPropertyDescriptor(res, prop) || {value: get(target, prop)}) : undefined;
    }
})
}

const resolve = (o) => {
    if (o?._Proxy) {
        return resolve(o._value)
    } else if (Array.isArray(o)) {
        const new_arr = [];
        let same = true;
        let i = o.length;
        while(i > 0) {
            i--;
            new_arr[i] = resolve(o[i]);
            same = same && o[i] === new_arr[i];
        }
        return same ? o : new_arr;
    } else if (typeof o === 'object' && !!o && o._needsresolve) {
        const entries = Object.entries(o);
        if(entries.length === 0) {
            return o;
        }

        let i = entries.length;
        let j = 0;
        let same = true;
        let new_obj_entries = [];
        let promise = false;
        while(i > 0) {
            i--;
            if(entries[i][0] !== '_needsresolve') {
                new_obj_entries[j] = [entries[i][0], resolve(entries[i][1])];
                same = same && entries[i][1] === new_obj_entries[j][1]
                promise = promise || ispromise(new_obj_entries[j][1])
                j++;
            }
        }
        return same ? (delete o._needsresolve, o) : promise 
            ? Promise.all(new_obj_entries.map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v])))
                .then(kvs => Object.fromEntries(kvs)) 
            : Object.fromEntries(new_obj_entries);
    } else {
        return o;
    }
}

const keywords = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with"])

class NodysseusError extends Error {
    constructor(node_id, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NodysseusError);
        }

        this.node_id = node_id;
    }
}

const node_value = (node) => {
    if(typeof node.value !== 'string') {
        return node.value;
    }

    if(typeof node.value === 'string' && node.value.match(/[0-9]*/g)[0].length === node.value.length) {
        const int = parseInt(node.value);
        if(!isNaN(int)){
            return int;
        }
    }

    if(typeof node.value === 'string' && node.value.match(/[0-9.]*/g)[0].length === node.value.length) {
        const float = parseFloat(node.value);
        if(!isNaN(float)) {
            return float;
        }
    }

    if(node.value === 'false' || node.value === 'true') {
        return node.value === 'true';
    }
    
    if(node.value.startsWith('{') || node.value.startsWith('[')) {
        try {
            return JSON.parse(node.value.replaceAll("'", "\""));
        } catch(e) { }
    }


    return node.value;
}

const node_nodes = (node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    const outid = `${node.id}/${node_ref.out ?? 'out'}`;
    const keys = node_ref.nodes.filter(n => n.ref === 'arg').map(n => n.value);
    const combined_data_input = typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) && data
            ? Object.assign({}, graph_input_value, data) 
            : inputs.length > 0 
            ? data
            : graph_input_value;

    let hit = false;
    if (!full_lib.no.runtime.get_node(graph, outid)) {
        full_lib.no.runtime.expand_node(graph, node.id, node_ref);
    }

    if (usecache && is_node_cached && cache.get(cache_id).has(outid)) {
        const val = cache.get(cache_id).get(outid);
        hit = compare(val[1], combined_data_input, keys);
        if (hit) {
            return val[0];
        }
    }

    const res = run_with_val(outid)(combined_data_input)
    if(typeof res === 'object' && !!res && !res._Proxy && !Array.isArray(res) && Object.keys(res).length > 0) {
        if(_needsresolve || !!res._needsresolve) {
            res._needsresolve = !!res._needsresolve || _needsresolve;
        } else if(res.hasOwnProperty("_needsresolve")) {
            delete res._needsresolve;
        }
    }
    if(usecache) {
        cache.get(cache_id).set(outid, [res, combined_data_input]);
    }
    return res;
}

const node_script = (node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    const argset = new Set();
    argset.add('_lib');
    argset.add('_node');
    argset.add('_node_inputs');
    argset.add('_graph');
    (inputs ?? []).forEach(i => i.as && argset.add(i.as));
    let orderedargs = "";
    const input_values = [];
    for(let a of argset) {
        input_values.push(
            a === '_node' 
            ? node 
            : a === '_lib'
            ? full_lib
            : a === '_node_inputs'
            ? data
            : a === '_graph'
            ? graph
            : data[a]);
        orderedargs += `${a},`;
    }

    if (usecache && is_node_cached && cache.get(cache_id).has(node.id)) {
        const val = cache.get(cache_id).get(node.id);
        let hit = compare(data, val[1]);
        // hit = hit && compare(graph_input_value, val[2]);
        if (hit) {
            return val[0]
        }
    }


    try {
        const fn = full_lib.no.runtime.get_fn(graph, orderedargs, node_ref);

        const is_iv_promised = input_values.reduce((acc, iv) => acc || ispromise(iv), false);
        const results = is_iv_promised 
            ? Promise.all(input_values.map(iv => Promise.resolve(iv))).then(iv => fn.apply(null, iv))
            : fn.apply(null, input_values);

        // don't cache things without arguments
        // if (node_ref.args?.length > 0) {
            if(usecache){
                cache.get(cache_id).set(node.id, [results, data]);
            }
        // }

        if(typeof results === 'object' && !!results && !results._Proxy && !Array.isArray(results) && Object.keys(results).length > 0) {
            if(_needsresolve || !!results._needsresolve) {
                results._needsresolve = !!results._needsresolve || _needsresolve;
            } else if(results.hasOwnProperty("_needsresolve")) {
                delete results._needsresolve;
            }
        }

        return results;
    } catch (e) {
        console.log(`error in node`);
        console.error(e);
        console.dir(node_ref);
        console.log(data);
        throw new AggregateError([
            new NodysseusError(
                node_id, 
                e instanceof AggregateError ? "Error in node chain" : e
            )]
            .concat(e instanceof AggregateError ? e.errors : []));
    }
}

const node_extern = (node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    const extern = get(full_lib, node_ref.extern);
    const args = extern.args.reduce((acc, arg) => {
            if(arg === '_node'){
                acc[0].push(node)
                return [acc[0], acc[1]];
            } else if (arg === '_node_inputs') {
                const res = extern.resolve ? resolve({...data, _needsresolve: true}) : data;
                if(Array.isArray(res)) {
                    res?.forEach(r => acc[0].push(r))
                } else {
                    acc[0].push(res);
                }
                return [acc[0], acc[1]]
            } else if (arg === '_graph') {
                acc[0].push(graph);
                return [acc[0], acc[1]]
            }
            const value = extern.resolve === false ? data[arg] : resolve(data[arg]);
            acc[0].push(value)
            return [acc[0], ispromise(value) || acc[1]];
        }, [[], false]);

    try {
        if (usecache && is_node_cached && cache.get(cache_id).has(node.id)) {
            const val = cache.get(cache_id).get(node.id);
            let hit = compare(args[0], val[1]);
            // hit = hit && compare(graph_input_value, val[2]);
            if (hit) {
                return val[0]
            }
        }

        if(args[1]) {
            return Promise.all(args[0]).then(as => {
                const res = extern.fn.apply(null, as);
                if(usecache){
                    cache.get(cache_id).set(node_id, [res, args[0]])
                }
                return res;
            })
        } else {
            const res = extern.fn.apply(null, args[0]);
            if(usecache){
                cache.get(cache_id).set(node_id, [res, args[0]])
            }
            return res;
        }
    } catch(e) {
        throw new AggregateError([
            new NodysseusError(
                node_ref.id, 
                e instanceof AggregateError ? "Error in node chain" : e
            )]
            .concat(e instanceof AggregateError ? e.errors : []));
            }
}

const create_input_data_map = (inputs, tryrun) => {
    const input_data_map = {};
    let i = inputs.length;
    while(i > 0) {
        i--;
        // input_data_map.set(inputs[i].from, tryrun(inputs[i]));
        input_data_map[inputs[i].from] = tryrun(inputs[i]);
    }

    return input_data_map;
}

const create_data = (inputs, input_data_map) => {
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
            let state_data = input_data_map[input.from];

            if (input.as) {
                data[input.as] = state_data;
            } else if (state_data !== undefined) {
                Object.assign(data, state_data)//, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
            }
        }
    }

    return data;
}

const executeGraph = ({ cache, graph, lib, cache_id}) => {
    const full_lib = {...nolib, ...(lib ?? {})}
    let usecache = true;

    if (!graph.nodes) {
        throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
    }

    if(graph._Proxy) {
        graph = graph._value;
    }

    const run_with_val = (node_id) => {
        return (graph_input_value, cache_id_node) => {

            let node = full_lib.no.runtime.get_node(graph, node_id);

            if(node === undefined) {
                throw new Error(`Undefined node_id ${node_id}`)
            }

            if (node.ref === "arg") {
                return full_lib.utility.arg.fn(node, graph_input_value);
            }

            if (node.value !== undefined && !node.script && !node.ref) {
                return node_value(node);
            }

            cache_id = cache_id_node ?? cache_id;
            if (!cache.has(cache_id)) {
                cache.set(cache_id, new Map([["__handles", 1]]));
            } else {
                // cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
            }

            let is_node_cached = full_lib.no.runtime.is_cached(graph, node_id);
            const inputs = full_lib.no.runtime.get_edges_in(graph, node_id);

            let node_ref;

            const ref = node.ref?.node_ref ?? typeof node.ref === 'string' ? node.ref : undefined;
            if (ref) {
                node_ref = full_lib.no.runtime.get_node(graph, ref);
                if(!node_ref) {
                    throw new Error(`Unable to find ref ${ref} for node ${node.name ?? node.id}`)
                }
            } else {
                node_ref = node;
            }

            let _needsresolve = false;

            const tryrun = (input) => {
                if (input.type === "ref") {
                    return input.from;
                } else if (input.from === "_graph_input_value" || input.from === graph.in) {
                    _needsresolve = _needsresolve || !!graph_input_value._needsresolve
                    return graph_input_value;
                } else if (input.type === "resolve") {
                    // if(!node_map.has(input.from)) {
                    //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
                    // }

                    return resolve(run_with_val(input.from)(graph_input_value));
                } else if (!input.as || node_ref.script) {
                    // if(!node_map.has(input.from)) {
                    //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
                    // }

                    let res = run_with_val(input.from)(graph_input_value);

                    while (res?._Proxy) {
                        res = res._value;
                    }
                    
                    _needsresolve = _needsresolve || (!!res && typeof res === 'object' && !!res._needsresolve)

                    return res;
                } else {
                    _needsresolve = true;
                    return createProxy(run_with_val, input, graph_input_value);
                }
            }


            // const input_data_map = new Map();
            const input_data_map = create_input_data_map(inputs, tryrun);
            const data = create_data(inputs, input_data_map);

            if (node_ref.nodes) {
                return node_nodes(node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve)
            } else if (node_ref.script) {
                return node_script(node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve)
            } else if(node_ref.extern) {
                return node_extern(node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve);
            }

            if (usecache && is_node_cached && cache.get(cache_id).has(node.id)) {
                const val = cache.get(cache_id).get(node.id);
                let hit = compare(data, val[1]);
                // hit = hit && compare(graph_input_value, val[2]);
                if (hit) {
                    return val[0];
                }
            }


            if(typeof data === 'object' && !!data && !data._Proxy && !Array.isArray(data) && Object.keys(data).length > 0) {
                data._needsresolve = true;
            }

            let is_promise = false;
            Object.entries(data).forEach(kv => {
                is_promise = is_promise || !!kv[1] && !kv[1]._Proxy && ispromise(kv[1]);
            })

            if(is_promise) {
                const promises = [];
                Object.entries(data).forEach(kv => {
                    promises.push([kv[0], Promise.resolve(kv[1])])
                })
                return Promise.all(promises)
                    .then(Object.fromEntries)
                    .then(res => (usecache ? cache.get(cache_id).set(node.id, [res, data]) : undefined, res));
            }

            if(usecache) {
                cache.get(cache_id).set(node.id, [data, data]);
            }

            return data;
        }
    }

    return (node_id) => (graph_input_value) => resolve(run_with_val(node_id)(graph_input_value));
}

//////////
// TODO: convert these to nodes

const calculateLevels = (nodes, links, graph, selected) => {
    const find_childest = n => {
        const e = graph.edges.find(ed => ed.from === n);
        if (e) {
            return find_childest(e.to);
        } else {
            return n;
        }
    }
    selected = selected[0];
    const top = find_childest(selected);

    const levels = new Map();
    bfs(graph, (id, level) => levels.set(id, Math.min(levels.get(id) ?? Number.MAX_SAFE_INTEGER, level)))(top, 0);

    const parents = new Map(nodes.map(n => [n.node_id, links.filter(l => l.target.node_id === n.node_id).map(l => l.source.node_id)]));

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

    const children = new Map(nodes
        .map(n => [n.node_id, 
            links.filter(l => l.source.node_id === n.node_id)
            .map(l => l.target.node_id)
        ]));
    const siblings = new Map(nodes.map(n => [n.node_id, [...(new Set(children.get(n.node_id)?.flatMap(c => parents.get(c) ?? []) ?? [])).values()]]))
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

const bfs = (graph, fn) => {
    const visited = new Set();
    const iter = (id, level) => {
        if (visited.has(id)) {
            return;
        }

        fn(id, level);

        visited.add(id);

        for (const e of graph.edges) {
            if (e.to === id) {
                iter(e.from, level + 1);
            }
        }
    }

    return iter;
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
                from: e.from === node_id ? node.id + "/" + (node.out ?? 'out') : e.from,
                to: e.to === node_id ? node.id + "/" + (node.in ?? 'in') : e.to
            }))
            .concat(flattened.flat_edges)
    };

    return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [node_id + '/' + (node.out ?? 'out')] };
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
        const name = data.name ?? node_id;

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
                let inside_node = old_node ?? Object.assign({}, data.display_graph.nodes.find(p => p.id === e.from));

                inside_node_map.set(inside_node.id, inside_node);
                inside_edges.add(e);
                if (!old_node) {
                    delete inside_node.inputs;
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

        let node_id_count = data.display_graph.nodes.filter(n => n.id === node_id).length;
        let final_node_id = node_id_count === 0 ? node_id : `${node_id}_${node_id_count}`

        // if there's no in node, just return
        if (in_node_id && !in_node_id.endsWith('in')) {
            return {display_graph: data.display_graph, selected: [data.node_id]};
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
                    id: final_node_id,
                    name: name === data.node_id ? data.node_name : name,
                    in: in_node_id?.startsWith(node_id + '/') ? in_node_id.substring(node_id.length + 1) : in_node_id,
                    out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
                    nodes: inside_nodes.map(n => ({
                        ...n,
                        id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id,
                        name: !n.name?.startsWith(name + "/") ? n.name : n.name.substring(name.length + 1)
                    })),
                    edges
                }]),
            edges: data.display_graph.edges
                .filter(e => keep_expanded || !(inside_node_map.has(e.from) && inside_node_map.has(e.to)))
                .map(e =>
                    e.from === data.node_id ? { ...e, from: final_node_id }
                        : e.to === in_node?.id ? { ...e, to: final_node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: final_node_id }
                                : e
                )
        };

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [final_node_id] };
    }
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

const objToGraph = (obj, path) => Object.entries(obj)
    .filter(e => e[0] !== '_value')
    .map(e => [e[0], typeof e[1] === 'object' && !!e[1] && !Array.isArray(e[1])
                ? Object.assign(e[1].hasOwnProperty('_value') ? {value: e[1]._value} : {}, objToGraph(e[1], path ? `${path}.${e[0]}` : e[0]))
                : {value: e[1]}]
    ).reduce((acc, n) => ({
        nodes: acc.nodes.concat(n[1].nodes ?? [])
            .concat([Object.assign({id: path ? `${path}.${n[0]}` : n[0], name: n[0]}, 
                n[1].hasOwnProperty('value') 
                    ? {value: n[1].value} 
                    : n[1].hasOwnProperty('_value') 
                    ? {value: n[1]._value} 
                    : {})]),
        edges: acc.edges.concat(n[1].edges ?? []).concat(path ? [{to: path, from: `${path}.${n[0]}`}] : [])
    })
    , {nodes: [], edges: []});

/////////////////////////////////

const cache = new Map();

const generic_nodes = new Set([
    "get",
    "set",
    "delete",
    "object",

    "switch",
    "if",
    "flow",

    "html",
    "html_element",
    "html_text",
    "toggle",
    "input",
    "css_styles",
    "css_anim",

    "array",
    "filter",
    "map",
    "append",

    "utility",
    "log",
    "execute_graph",
    "arg",
    "apply",
    "partial",
    "fetch",
    "call",
    "default",
    "merge_objects",
    "sequence",
    "runnable",
    "run",
    "dispatch_runnable",
    "object_entries",
    "import_json",
    "event_publisher",
    "event_subscriber",
    "input_value",

    "math",
    "add",
    "divide",
    "mult",
    "negate",

    "JSON",
    "stringify",
    "parse",

    "state",
    "modify_state_runnable",
    "initial_state_runnable",
    "set_display",

    "custom"
]);

const ispromise = a => a?._Proxy ? false : typeof a?.then === 'function';
const getorset = (map, id, value_fn) => {
	if(map.has(id)) {
		return map.get(id);
	} else {
		const val = value_fn();
		map.set(id, val);
		return val
	}
}

const nolib = {
    just: { 
        get: {
            args: ['target', 'path', 'def'],
            fn: (target, path, def) => {
                return get(target?._Proxy ? target._value : target, path?._Proxy ? path._value : path, def?._Proxy ? def._value : def);
            },
        },
        set, 
        diff,
        diffApply
    },
    no: {
        executeGraph: ({ state, graph, cache_id, lib }) => executeGraph({ cache, state, graph, cache_id: cache_id ?? "main" })(graph.out)(state.get(graph.in)),
        executeGraphValue: ({ graph, cache_id, lib }) => executeGraph({ cache, graph, cache_id: cache_id ?? "main", lib })(graph.out),
        executeGraphNode: ({ graph, cache_id, lib }) => executeGraph({ cache, graph, cache_id: cache_id ?? "main", lib }),
        runGraph: (graph, node, args, lib) => node !== undefined
            ? executeGraph({graph, cache, cache_id: "main", lib})(node)(args)
            : executeGraph({graph: graph.graph, cache, cache_id: "main", lib})(graph.fn)(graph.args),
        resolve,
        objToGraph,
        NodysseusError,
        runtime: (function(){
            const cache = new Map(); 
            const new_graph_cache = (graph) => ({
                graph,
                node_map: new Map(graph.nodes.map(n => [n.id, n])), 
                in_edge_map: new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)])),
                fn_cache: new Map(),
                listeners: new Map()
            });
            const getorsetgraph = (graph, id, path, valfn) => getorset(getorset(cache, graph.id, () => new_graph_cache(graph))[path], id, valfn);
            const publish = (graph, event, data) => {
                if(event === 'graphchange'){
                    cache.get(graph.id).graph = graph;
                }
                const listeners = getorsetgraph(graph, event, 'listeners', () => new Map());
                for(let l of listeners.values()) {
                    if(typeof l === 'function') {
                        l(graph, data);
                    } else if(typeof fn === 'object' && fn.fn && fn.graph) {
                        nolib.no.runGraph(fn.graph, fn.fn, Object.assign({}, fn.args ?? {}, {data}))
                    }
                }

            }

            let worker = false; //typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? false : new Worker('./worker.js');
            if(worker){
                worker.onerror = (e) => worker = false;
                worker.onmessage = (e) => {
                    console.log(e);
                    cache.get(e.data.graph.id).last_result = e.data.result;
                }
            }

            const rungraph = graph => {
                if(!self.cancelAnimationFrame) {
                    self.cancelAnimationFrame = () => {};
                }
                self.cancelAnimationFrame(cache.get(graph.id).animrun)
                if(!self.requestAnimationFrame) {
                    self.requestAnimationFrame = fn => fn();
                }
                cache.get(graph.id).animrun = self.requestAnimationFrame(() =>{
                    try {
                        graph = resolve(graph);
                        const gcache = cache.get(graph.id);
                        const last_result = gcache.last_result;
                        
                        if(worker){
                            worker.postMessage({graph, fn: graph.out ?? 'main/out', args: last_result ?? {}});
                        } else {
                            const result = nolib.no.runGraph(graph, graph.out ?? 'main/out', last_result ?? {});
                            Promise.resolve(result).then(res => {
                                gcache.last_result = res;
                                publish(graph, 'graphrun', res);
                                if(graph.nodes.find(n => n.ref === 'arg' && res[n.value] !== last_result?.[n.value]) !== undefined){
                                    rungraph(graph);
                                }
                            }).catch(e => publish(graph, 'grapherror', e))
                        }
                    } catch(e) {
                        publish(graph, 'grapherror', e);
                    }
                })
            }

            const add_listener = (graph, event, listener_id, fn, remove) => {
                if(remove) {
                    remove_listener(graph, event, listener_id);
                }

                const listeners = getorsetgraph(graph, event, 'listeners', () => new Map());
                listeners.set(listener_id, fn);
                
                //TODO: rethink this maybe?
                if(event !== 'graphchange') {
                    add_listener(graph, 'graphchange', 'rungraph', rungraph);
                }
            }

            const remove_listener = (graph, event, listener_id) => {
                const listeners = cache.get(graph.id).listeners;
                for(let l of listeners.values()) {
                    l.delete(listener_id);
                }
                
                //TODO: rethink this maybe?
                if (listeners.size === 0) {
                    const graph_listeners = cache.get(graph.id).listeners;
                    graph_listeners.delete(event);
                    if (graph_listeners.size === 1 && graph_listeners.has('graphchange')){
                        remove_listener(graph, 'graphchange', 'rungraph');
                    }
                }
            }

            const update_graph = (graph) => {
                graph = resolve(graph);
                const new_cache = new_graph_cache(graph);
                getorset(cache, graph.id, () => new_cache).node_map = new_cache.node_map;
                getorset(cache, graph.id, () => new_cache).in_edge_map = new_cache.in_edge_map;
                publish(graph, 'graphchange');
            }

            const get_node = (graph, id) => getorsetgraph(resolve(graph), id, 'node_map', () => graph.nodes.find(n => n.id === id));
            const get_edges_in = (graph, id) => getorsetgraph(resolve(graph), id, 'in_edge_map', () => graph.edges.filter(e => e.to === id));

            return { 
                add_graph: (graph) => {
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(graph));
                    add_listener(graph, 'graphchange', 'update_gcache', g => gcache.graph = g);
                    publish(graph, 'graphchange');
                },
                is_cached: (graph, id) => getorset(cache, graph.id, () => new_graph_cache(graph)).node_map.has(id),
                get_node,
                get_edges_in,
                get_fn: (graph, orderedargs, node_ref) => getorsetgraph(resolve(graph), orderedargs + node_ref.script, 'fn_cache', () => new Function(`return function _${(node_ref.name?.replace(/\W/g, "_") ?? node_ref.id).replace(/(\s|\/)/g, '_')}(${orderedargs}){${node_ref.script}}`)()),
                update_graph,
                edit_edge: (graph, edge, old_edge) => {
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
                    graph = gcache.graph;

                    gcache.in_edge_map.delete((old_edge ?? edge).to);
                    edge.as = edge.as ?? 'arg0';
                    // const next_edge = !edge.as 
                    //     ? lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph}) 
                    //     : edge;

                    const new_graph = {
                        ...graph,
                        edges: graph.edges.filter(e => !(e.to === (old_edge ?? edge).to && e.from === (old_edge ?? edge).from)).concat([edge])
                    }
                    publish(new_graph, 'graphchange');
                },
                add_node: (graph, node, edge) => {
                    // node = resolve(node);
                    // edge = resolve({...edge, _needsresolve: true});
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
                    graph = gcache.graph;
                    const graph_node = get_node(graph, node.id);


                    const old_edge_out = graph.edges.find(e => e.from === node.id);

                    gcache.node_map.delete(node.id);
                    gcache.in_edge_map.delete(node.id);
                    gcache.in_edge_map.delete(old_edge_out?.to);
                    gcache.fn_cache.delete(node.id);

                    if (graph_node?.nodes || graph_node?.ref && get_node(graph, graph_node.ref).nodes) {
                        for(let k of gcache.node_map.keys()) {
                            if(k.startsWith(node.id)) {
                                gcache.node_map.delete(k)
                            }
                        }

                        for(let k of gcache.in_edge_map.keys()) {
                            if(k.startsWith(node.id)) {
                                gcache.in_edge_map.delete(k);
                            }
                        }
                    }

                    const edge_out = edge ? nolib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph}) : undefined;

                    const edges_in = get_edges_in(graph, node.id);
                    if (edges_in && edges_in.length > 0) {
                        const needed_args = nolib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'node_args', {node, nodes: graph.nodes});
                    }

                    const new_graph = {
                        ...graph, 
                        nodes: graph.nodes.filter(n => n.id !== node.id).concat([node]), 
                        edges: edge ? graph.edges.filter(e => !(e.from === edge_out.from && e.to === edge_out.to)).concat(edge_out) : graph.edges
                    };

                    publish(new_graph, 'graphchange');
                },
                delete_node: (graph, id) => {
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
                    graph = gcache.graph;

                    const parent_edge = graph.edges.find(e => e.from === id);
                    const child_edges = graph.edges.filter(e => e.to === id);

                    const current_child_edges = graph.edges.filter(e => e.to === parent_edge.to);
                    const new_child_edges = child_edges.map((e, i) => ({...e, to: parent_edge.to, as: i === 0 ? parent_edge.as : !e.as ? e.as : current_child_edges.find(ce => ce.as === e.as && ce.from !== id) ? e.as + '1' : e.as}));

                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter(n => n.id !== id),
                        edges: graph.edges.filter(e => e !== parent_edge && e.to !== id).concat(new_child_edges)
                    }

                    update_graph(new_graph);
                },
                add_listener,
                add_listener_extern: {
                    args: ['graph', 'event', 'listener_id', 'fn'],
                    add_listener,
                },
                remove_listener,
                publish: {
                    args: ['_graph', 'event', 'data'],
                    fn: publish
                },
                expand_node: (graph, id, node_ref) => {
                    // TODO: fix this mess
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(graph));
                    graph = gcache.graph;
                    for (let i = 0; i < node_ref.edges.length; i++) {
                        const new_edge = Object.assign({}, node_ref.edges[i]);
                        new_edge.from = `${id}/${new_edge.from}`;
                        new_edge.to = `${id}/${new_edge.to}`;
                        // working_graph.edges.push(new_edge);
                        if(!gcache.in_edge_map.get(new_edge.to)?.find(e => e.from === new_edge.from && e.as === new_edge.as)) {
                            gcache.in_edge_map.set(new_edge.to, (gcache.in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                        }
                        // in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                    }

                    for (const child of node_ref.nodes) {
                        const new_node = Object.assign({}, child);
                        new_node.id = `${id}/${child.id}`;
                        // working_graph.nodes.push(new_node)
                        if(!gcache.node_map.get(new_node.id)) {
                            gcache.node_map.set(new_node.id, new_node);
                        } 
                        // node_map.set(new_node.id, new_node);
                        const has_inputs = gcache.in_edge_map.has(new_node.id);
                        if (new_node.id === `${id}/${node_ref.in ?? 'in'}`) {
                            // in_edge_map.get(node.id).map(e => ({ ...e, to: `${node.id}/${node_ref.in ?? 'in'}` }))
                            //     .forEach(e => working_graph.edges.push(e));
                            if(!gcache.in_edge_map.has(new_node.id)) {
                                const new_edges = [];
                                gcache.in_edge_map.get(id).forEach(e => {
                                    new_edges.push({ ...e, to: `${id}/${node_ref.in ?? 'in'}`})
                                })
                                gcache.in_edge_map.set(new_node.id, new_edges)
                            }
                            // in_edge_map.set(new_node.id, working_graph.edges.filter(e => e.to === `${node.id}/${node_ref.in ?? 'in'}`))
                        } else if (!has_inputs) {
                            // in_edge_map.set(new_node.id, []);
                            gcache.in_edge_map.set(new_node.id, []);
                        }
                    }
                }
            }
        })()
    },
    utility: {
        eq: ({a, b}) => a === b,
        arg: {
            args: ['_node', 'target'],
            resolve: false,
            fn: (node, target) => typeof node.value === 'string' 
                ? node.value === '_args' 
                    ? target
                    : get(target, node.value) 
                : node.value === '_graph'
                ? graph
                : node.value === '_node'
                ? node
                : node.value !== undefined && target !== undefined
                ? target[node.value]
                : undefined,
        },
        new_array: {
            args: ['_node_inputs'],
            resolve: false,
            fn: (args) => {
                const arr = Object.keys(args)
                    .sort()
                    .reduce((acc, k) => [
                            acc[0].concat([args[k]]), 
                            acc[1] || ispromise(args[k])
                        ], [[], false]);
                return arr[1] ? Promise.all(arr[0]) : arr[0];
            }
        },
        fetch: {
            args: ['url', 'params'],
            fn: fetch
        },
        call: {
            args: ['fn', 'args', 'self'],
            fn: (fn, args, self) => typeof self === 'function' ? self(...((args ?? []).reverse().reduce((acc, v) => [!acc[0] && v !== undefined, acc[0] || v !== undefined ? acc[1].concat([v]) : acc[1]], [false, []])[1].reverse())) : self[fn](...((args ?? []).reverse().reduce((acc, v) => [!acc[0] && v !== undefined, acc[0] || v !== undefined ? acc[1].concat([v]) : acc[1]], [false, []])[1].reverse()))
        },
        merge_objects: {
            args: ['_node_inputs'],
            resolve: false,
            fn: (args) => {
                const keys = Object.keys(args).sort();
                const promise = keys.reduce((acc, k) => acc || ispromise(args[k]), false);
                return promise 
                    ? Promise.all(keys.map(k => Promise.resolve(args[k])))
                        .then(es => Object.assign({}, ...es.map(k => args[k]?._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object'))) 
                    : Object.assign({}, ...keys.map(k => args[k]?._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object'))
                    // Object.fromEntries(keys
                    //     .map(k => args[k]?._Proxy ? args[k]._value : args[k])
                    //     .flatMap(o => typeof o === 'object' && o ? Object.entries(o) : [])
                    // )
            }
        },
        add: {
            args: ["_node_inputs"],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc + v, 0)
        },
        mult: {
            args: ["_node_inputs"],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc * v, 1)
        },
        negate: {
            args: ["value"],
            resolve: true,
            fn: (value) => -value
        },
        divide: {
            args: ["_node_inputs"],
            resolve: true,
            fn: (args) => Object.values(args).reduce((acc, v) => acc / v, 1)
        }
    },
    JSON: {
        stringify: {
            args: ['object'],
            resolve: true,
            fn: (args) => JSON.stringify(args)
        },
        parse: {
            args: ['string'],
            resolve: true,
            fn: (args) => JSON.parse(args)
        }
    },
    Fuse,
    // THREE
};

const add_default_nodes_and_edges = g => ({
    ...g, 
    nodes: g.nodes
        .filter(n => !generic_nodes.has(n.id))
        .concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id))),
    edges: g.edges
        .filter(e => !generic_nodes.has(e.from))
        .concat(DEFAULT_GRAPH.edges.filter(e => generic_nodes.has(e.to))) 
})

const runGraph = nolib.no.runGraph;

export { nolib, runGraph, objToGraph, flattenNode, bfs, calculateLevels, compare, hashcode, contract_all, contract_node, expand_node, add_default_nodes_and_edges, ispromise, resolve };