import DEFAULT_GRAPH from "./json/pull.json"
import examples from "./json/examples.json"
import get from "just-safe-get";
import set from "just-safe-set";
import { diff } from "just-diff";
import { h, app, text, memo } from "hyperapp"
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceX, forceY, forceCollide } from "d3-force";
import Fuse from "fuse.js";
import panzoom from "panzoom";

function compare(value1, value2) {
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

        return compareObjects(value1, value2);
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

function compareObjects(value1, value2) {
    var keys1 = Object.keys(value1);
    var keys2 = Object.keys(value2);
    var len = keys1.length;
    if (len != keys2.length) {
        return false;
    }
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var key1 = keys1[i];
        // var key2 = keys2[i];
        if (value1[key1] !== value2[key1]) {
            return false;
        }
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
        } if (prop === 'toJSON') {
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

const executeGraph = ({ cache, graph, cache_id, node_cache }) => {
    let usecache = true;

    if (!cache.has(cache_id)) {
        cache.set(cache_id, new Map([["__handles", 1]]));
    } else {
        cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
    }

    if (!graph.nodes) {
        throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
    }

    if(graph._Proxy) {
        graph = graph._value;
    }

    const node_map = graph.node_map ?? new Map(graph.nodes.map(n => [n.id, n]));
    graph.node_map = node_map;

    const in_edge_map = graph.in_edge_map ?? new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)]));
    graph.in_edge_map = in_edge_map;

    const run_with_val = (node_id) => (graph_input_value) => {
        // while(node_id.indexOf("/") > 0 && !node_map.has(node_id)) {
        //     const path = node_id.split('/');
        //     let i = 1;
        //     while(node_map.has(path.slice(0, i).join("/"))){
        //         i++;
        //     }

        //     const nested_id = path.slice(0, i - 1).join("/");
        //     const nested = node_map.get(nested_id);

        //     node_map.delete(nested_id);
        //     graph.nodes = graph.nodes.filter(n => n.id !== path.slice(0, i - 1).join("/"));
        //     nested.nodes.forEach(n => graph.nodes.push({...n, id: nested_id + "/" + n.id}));
        //     nested.nodes.forEach(n => node_map.set(nested_id + "/" + n.id, {...n, id: nested_id + "/" + n.id}));
        //     nested.edges.forEach(e => graph.edges.push({...e, from: nested_id + "/" + e.from, to: nested_id + "/" + e.to}));
        //     nested.nodes.forEach(n => in_edge_map.set(nested_id + "/" + n.id, nested.edges.filter(e => e.to === n.id).map(e => ({...e, from: nested_id + "/" + e.from, to: nested_id + "/" + e.to}))));
        // }

        let node = node_map.get(node_id);
        

        if(node === undefined) {
            throw new Error(`Undefined node_id ${node_id}`)
        }

        // if(!node.inputs || node.inputs.length !== in_edge_map.get(node_id).length) {
            Object.assign(node, { inputs: in_edge_map.get(node_id) });
        // }

        if (node.ref === "arg" && (!node.inputs || node.inputs.length === 0)) {
            node.inputs.push({ from: "_graph_input_value", to: node.id, as: 'target' });
        }

        if (node.value !== undefined && !node.script && !node.ref) {
            if(typeof node.value === 'string' && node.value.match(/[0-9]*/g)[0].length === node.value.length) {
                const int = parseInt(node.value);
                if(!isNaN(int)){
                    return int;
                }
            }

            if(typeof node.value === 'string' && node.value.match(/[0-9.]*/g)[0].length === node.value.length) {
                const int = parseInt(node.value);
                const float = parseFloat(node.value);
                if(!isNaN(float)) {
                    return float;
                }
            }

            if(typeof node.value !== 'string') {
                return node.value;
            }

            
            if(node.value.startsWith('{') || node.value.startsWith('[')) {
                try {
                    return  JSON.parse(node.value.replaceAll("'", "\""));
                } catch(e) { }
            }

            return node.value;
        }

        let node_ref;

        const ref = node.ref?.node_ref ?? typeof node.ref === 'string' ? node.ref : undefined;
        if (ref) {
            const node_map_ref = node_map.get(ref);
            if (node_map_ref) {
                node_ref = Object.assign({}, node_map_ref, node)
                node_ref._noderefflag = !!node._noderefflag;
            } else {
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
                if(!node_map.has(input.from)) {
                    throw new Error(`Input not found ${input.from} for node ${node_id}`)
                }

                return resolve(run_with_val(input.from)(graph_input_value));
            } else if (!input.as || node_ref.script) {
                if(!node_map.has(input.from)) {
                    throw new Error(`Input not found ${input.from} for node ${node_id}`)
                }

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

        const input_data_map = new Map();
        let i = node.inputs.length;
        while(i > 0) {
            i--;
            input_data_map.set(node.inputs[i].from, tryrun(node.inputs[i]));
        }
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
                let state_data = input_data_map.get(input.from);

                if (input.as) {
                    data[input.as] = state_data;
                } else if (state_data !== undefined) {
                    Object.assign(data, state_data)//, {_needsresolve: !!data._needsresolve || !!state_data._needsresolve});
                }
            }
        }

        if (node_ref.nodes) {

            const outid = `${node.id}/${node_ref.out ?? 'out'}`;
            let hit = false;
            if (!node_map.has(outid)) {
                for (let i = 0; i < node_ref.edges.length; i++) {
                    const new_edge = Object.assign({}, node_ref.edges[i]);
                    new_edge.from = `${node.id}/${new_edge.from}`;
                    new_edge.to = `${node.id}/${new_edge.to}`;
                    graph.edges.push(new_edge);
                    in_edge_map.set(new_edge.to, (in_edge_map.get(new_edge.to) ?? []).concat([new_edge]))
                }

                for (const child of node_ref.nodes) {
                    const new_node = Object.assign({}, child);
                    new_node.id = `${node.id}/${child.id}`;
                    graph.nodes.push(new_node)
                    node_map.set(new_node.id, new_node);
                    const has_inputs = in_edge_map.has(new_node.id);
                    if (new_node.id === `${node.id}/${node_ref.in ?? 'in'}`) {
                        graph.edges = graph.edges.map(e => ({ ...e, to: e.to === node.id ? `${node.id}/${node_ref.in ?? 'in'}` : e.to }));
                        in_edge_map.set(new_node.id, graph.edges.filter(e => e.to === `${node.id}/${node_ref.in ?? 'in'}`))
                    } else if (!has_inputs
                        && new_node.ref === "arg"
                        && node_ref.nodes.find(n => n.id ===  `${node.id}/${node_ref.in ?? 'in'}`) !== undefined) {
                        const new_edge = { from: `${node.id}/${node_ref.in ?? 'in'}`, to: new_node.id, as: "target"};
                        in_edge_map.set(new_node.id, [new_edge])
                        graph.edges.push(new_edge);
                    } else if (!has_inputs) {
                        in_edge_map.set(new_node.id, []);
                        new_node.inputs = [];
                    }
                }
            }

            const combined_data_input = typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) && data
                    ? Object.assign({}, graph_input_value, data) 
                    : inputs.length > 0 
                    ? data
                    : graph_input_value;

            if (node_map.has(`${node.id}/${node_ref.in ?? 'in'}`)) {
                node_map.get(`${node.id}/${node_ref.in ?? 'in'}`).value = combined_data_input
            }


            if (usecache && cache.get(cache_id).has(outid)) {
                const val = cache.get(cache_id).get(outid);
                hit = compare(val[1], combined_data_input);
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
            cache.get(cache_id).set(outid, [res, combined_data_input]);
            return res;
        } else if (node_ref.script) {
            const argset = new Set();
            argset.add('_lib');
            argset.add('_node');
            argset.add('_node_inputs');
            argset.add('_graph');
            (inputs ?? []).map(i => i.as).forEach(i => i && argset.add(i));
            let orderedargs = "";
            const input_values = [];
            for(let a of argset) {
                input_values.push(
                    a === '_node' 
                    ? node 
                    : a === '_lib'
                    ? lib
                    : a === '_node_inputs'
                    ? data
                    : a === '_graph'
                    ? graph
                    : data[a]);
                orderedargs += `${a},`;
            }

            if (usecache && cache.get(cache_id).has(node.id)) {
                const val = cache.get(cache_id).get(node.id);
                let hit = usecache && compare(data, val[1]);
                // hit = hit && compare(graph_input_value, val[2]);
                if (hit) {
                    return val[0]
                }
            }


            try {
                const node_hash = hashcode(orderedargs + node_ref.script);

                const fn = node_cache.get(node_hash) ?? new Function(`return function _${(node.name?.replace(/\W/g, "_") ?? node.id).replace(/(\s|\/)/g, '_')}(${orderedargs}){${node_ref.script}}`)();

                if(!node_ref.fn) {
                    node_cache.set(node_hash, fn);
                }

                node_ref.fn = fn;


                const results = fn.apply(null, input_values);

                // don't cache things without arguments
                if (node_ref.args?.length > 0) {
                    cache.get(cache_id).set(node.id, [results, data]);
                }

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
                        node_ref.name ?? node_ref.id, 
                        e instanceof AggregateError ? "Error in node chain" : e
                    )]
                    .concat(e instanceof AggregateError ? e.errors : []));
            }
        } else if(node_ref.extern) {
            const extern = get(lib, node_ref.extern);
            const args = extern.args.reduce((acc, arg) => {
                    if(arg === '_node'){
                        return [acc[0].concat([node]), acc[1]];
                    } else if (arg === '_node_inputs') {
                        return [acc[0].concat(data), acc[1]]
                    } else if (arg === '_graph') {
                        return [acc[0].concat(graph), acc[1]]
                    }
                    const value = extern.resolve === false ? data[arg] : resolve(data[arg]);
                    return [acc[0].concat([value]), ispromise(value) || acc[1]];
                }, [[], false]);

            return args[1] ? Promise.all(args[0]).then(as => extern.fn.apply(null, as)) : extern.fn.apply(null, args[0]);
        }

        if(typeof data === 'object' && !!data && !data._Proxy && !Array.isArray(data) && Object.keys(data).length > 0) {
            data._needsresolve = true;
        }

        const promised_data = Object.entries(data).reduce((acc, kv) => [acc[0].concat([kv]), acc[1] || (!!kv[1] && !kv[1]?._Proxy && ispromise(kv[1]))], [[], false]);
        
        if(promised_data[1]) {
            return Promise.all(promised_data[0].map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v]))).then(Object.fromEntries);
        }


        return data;
    }

    return (node_id) => (graph_input_value) => resolve(run_with_val(node_id)(graph_input_value));
}

//////////
// TODO: convert these to nodes

const calculateLevels = (nodes, links, graph, selected) => {
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

const updateSimulationNodes = (dispatch, data) => {
    if(data.static) {
        const ids = data.display_graph.nodes.map(n => n.id).join(',');
        const selected = data.display_graph.out;

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
            const increment = Math.PI * 2 / (Math.max(1, sibling_count - 1) * (Math.pow(Math.PI, 2 * (levels.get(n.id) - 1)) + 1));
            const offset = child ? node_positions.get(child)[2] : 0;
            const theta = ((siblings.findIndex(l => l == n.id) - (siblings.length === 1 ? 0 : 0.5)) * increment) + offset;
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
            dispatch([resolve(data.sim_to_hyperapp), node_data])
            requestAnimationFrame(() => {
                dispatch(s => [s, [s.panzoom_selected_effect, {...s, ...node_data, selected: s[0]}]]);
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

        const node_hash = hashcode(nid);
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
            data.simulation.alpha(data.sim_update_alpha);
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

const graphToSimulationNodes = (data, payload) => {

    return {
        ...data,
        nodes,
        links,
        fuse_links
    }
}

const listenToEvent = (dispatch, props) => {
    const listener = (event) => requestAnimationFrame(() => dispatch(props.action, event.detail))

    requestAnimationFrame(() => addEventListener(props.type, listener));
    return () => removeEventListener(props.type, listener);
}

const listen = (type, action) => [listenToEvent, {type, action}]

// Creates the simulation, updates the node elements when the simulation changes, and runs an action when the nodes have settled.
// This is probably doing too much.
const d3subscription = (dispatch, props) => {
    const simulation = lib.d3.forceSimulation()
        .force('charge', lib.d3.forceManyBody().strength(-64).distanceMax(256).distanceMin(64).strength(0))
        .force('collide', lib.d3.forceCollide(64))
        .force('links', lib.d3
            .forceLink([])
            .distance(l => l.distance ?? 128)
            .strength(l => l.strength)
            .id(n => n.node_child_id))
        .force('link_direction', lib.d3.forceY().strength(.01))
        .force('center', lib.d3.forceCenter().strength(0.01))
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
                dispatch(s => [s, [s.panzoom_selected_effect, {...s, selected: s.selected[0]}]])
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

const expand_node = (data) => {
    const node_id = data.node_id;
    const node = data.display_graph.nodes.find(n => n.id === node_id)

    if (!(node && node.nodes)) {
        console.log('no nodes?');
        return { display_graph: data.display_graph, selected: [data.node_id] };
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
                let inside_node = old_node ?? Object.assign({}, data.display_graph.nodes.find(p => p.id === e.from));

                if (((inside_node.name ?? inside_node.id)?.endsWith('/in') && 
                    !(inside_node.name ?? inside_node.id).endsWith(name + '/in')) 
                    || ((inside_node.name ?? inside_node.id)?.endsWith('/out') && 
                        !(inside_node.name ?? inside_node.id).endsWith(name + '/out'))) {
                    in_edge.push(e);
                    continue;
                }

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
                    e.from === data.node_id ? { ...e, from: node_id }
                        : e.to === in_node?.id ? { ...e, to: node_id }
                            : inside_node_map.has(e.to)
                                ? { ...e, to: node_id }
                                : e
                )
        };

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [node_id] };
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
            el.setAttribute('x', Math.floor(x - 20));
            el.setAttribute('y', Math.floor(y - 20));

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
const is_action_payload = Array.isArray(ha_action) 
    && ha_action.length === 2
    && (typeof ha_action[0] === 'function' 
            || (ha_action[0].hasOwnProperty('fn') 
                && ha_action[0].hasOwnProperty('graph')));
    const action = is_action_payload ? ha_action[0] : ha_action;
    const payload = is_action_payload ? ha_action[1] : ha_payload;

    return typeof action === 'object' && action.hasOwnProperty('fn') && action.hasOwnProperty('graph')
        ? dispatch((state, payload) => {
            const execute_graph_fn = lib.no.executeGraphNode({graph: action.graph})(action.fn);
            Object.defineProperty(execute_graph_fn, 'name', {value: action.fn, writable: false});
            const result = action.stateonly 
                ? execute_graph_fn(state)
                : execute_graph_fn({state, payload});
            const effects = (result.effects ?? []).filter(e => e).map(e => {
                if(typeof e === 'object' 
                && e.hasOwnProperty('fn') 
                && e.hasOwnProperty('graph')) {
                    const effect_fn = lib.no.executeGraphNode({graph: e.graph})(e.fn);
                    Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
                    return effect_fn;
                }
                return e
            });

            return result.hasOwnProperty("state")
                ? effects.length > 0 ? [result.state, ...effects] : result.state
                : [result.action, result.payload];
            }, payload)
        : dispatch(action, payload)
}

/////////////////////////////////

const cache = new Map();
const node_cache = new Map();

const generic_nodes = new Set([
    "get",
    "set",
    "delete",
    "object",

    "switch",
    "if",
    "flow",

    "hyperapp",
    "h",
    "h_text",
    "toggle",
    "input",

    "array",
    "new_array",
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

    "JSON",
    "stringify",
    "parse",

    "custom"
]);

const ispromise = a => a?._Proxy ? false : typeof a?.then === 'function';

const lib = {
    just: { 
        get: {
            args: ['target', 'path', 'def'],
            fn: get,
            // _: (target, path, def) => ispromise(target) || ispromise(path) 
            //     ? Promise.resolve(target).then(t => 
            //         Promise.resolve(path).then(p => 
            //             Promise.resolve(def).then(d => 
            //                 get(t, p, d))))
            //     : get(target, path, def),
        },
        set, 
        diff
    },
    ha: { h: {args: ['dom_type', 'props', 'children'], fn: h}, app, text: {args: ['text'], fn: text}, memo },
    no: {
        middleware,
        executeGraph: ({ state, graph, cache_id }) => executeGraph({ cache, state, graph, node_cache, cache_id: cache_id ?? "main" })(graph.out)(state.get(graph.in)),
        executeGraphValue: ({ graph, cache_id }) => executeGraph({ cache, graph, node_cache, cache_id: cache_id ?? "main" })(graph.out),
        executeGraphNode: ({ graph, cache_id }) => executeGraph({ cache, graph, node_cache, cache_id: cache_id ?? "main" }),
        runGraph: (graph, node, value) => executeGraph({graph, cache, node_cache, cache_id: "main"})(node)(value),
        resolve,
        objToGraph,
        NodysseusError
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
                : target[node.value],
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
            fn: (fn, args, self) => self[fn](...((args ?? []).reverse().reduce((acc, v) => [!acc[0] && v !== undefined, acc[0] || v !== undefined ? acc[1].concat([v]) : acc[1]], [false, []])[1].reverse()))
        },
        merge_objects: {
            args: ['_node_inputs'],
            resolve: false,
            fn: (args) => {
                const keys = Object.keys(args).sort();
                const promise = keys.reduce((acc, k) => acc || ispromise(args[k]), false);
                return promise 
                    ? Promise.all(keys.map(k => Promise.resolve(args[k])))
                        .then(es => Object.fromEntries(es.flatMap(Object.entries))) 
                    : Object.fromEntries(keys.flatMap(k => Object.entries(args[k])))
            }
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
    scripts: { d3subscription, updateSimulationNodes, graphToSimulationNodes, expand_node, flattenNode, contract_node, keydownSubscription, calculateLevels, contract_all, listen},
    d3: { forceSimulation, forceManyBody, forceCenter, forceLink, forceRadial, forceY, forceCollide, forceX },
    Fuse,
    pz: {
        panzoom: (dispatch, sub_payload) => {
            let instance;
            let lastpanzoom = 0;
            const panzoom_selected_effect = (dispatch, payload) => {
                if(!instance){ return; }
                lastpanzoom = performance.now();
                const viewbox = findViewBox(
                    payload.nodes, 
                    payload.links, 
                    payload.selected, 
                    payload.node_el_width, 
                    payload.html_id,
                    payload.dimensions
                );
                const x = payload.dimensions.x * 0.5 - viewbox.center.x;
                const y = payload.dimensions.y * 0.5 - viewbox.center.y
                instance.moveTo(x, y);
                instance.zoomTo(x, y, 1 / instance.getTransform().scale)

                if(!payload.prevent_dispatch) {
                    dispatch(sub_payload.action, {event: 'effect_transform', transform: instance.getTransform()})
                }
            }

            let init = requestAnimationFrame(() => {
                instance = panzoom(document.getElementById(sub_payload.id), {
                    // onTouch: e => false,
                    // filterKey: e => true,
                    smoothScroll: false
                });
                instance.on('panstart', e => performance.now() - lastpanzoom > 100 ? dispatch(sub_payload.action, {event: 'panstart', transform: e.getTransform()}) : undefined);
                instance.moveTo(window.innerWidth * 0, window.innerHeight * 0.5);
            });
            requestAnimationFrame(() => dispatch(s => [{...s, panzoom_selected_effect}]));
            return () => { cancelAnimationFrame(init); instance?.dispose(); }
        }
    }
    // THREE
};

const graph_list = JSON.parse(localStorage.getItem("graph_list"));
// const display_graph = {...DEFAULT_GRAPH, nodes: DEFAULT_GRAPH.nodes.map(n => ({...n})), edges: DEFAULT_GRAPH.edges.map(e => ({...e}))};
const stored = localStorage.getItem(graph_list?.[0]);
const init_display_graph = stored ? JSON.parse(stored) : examples.find(g => g.id === 'simple_html_hyperapp');
const original_graph = {...DEFAULT_GRAPH, nodes: [...DEFAULT_GRAPH.nodes].map(n => ({...n})), edges: [...DEFAULT_GRAPH.edges].map(e => ({...e}))};

const runGraph = lib.no.runGraph;

const nodysseus = function(html_id, display_graph) {
    const dispatch = runGraph(DEFAULT_GRAPH, "initialize_hyperapp_app", { 
        graph: DEFAULT_GRAPH, 
        original_graph, 
        display_graph: { 
            ...(display_graph ?? init_display_graph), 
            nodes: (display_graph ?? init_display_graph).nodes
                .filter(n => !generic_nodes.has(n.id))
                .concat(DEFAULT_GRAPH.nodes.filter(n => generic_nodes.has(n.id))), 
            edges: (display_graph ?? init_display_graph).edges
                .filter(e => !generic_nodes.has(e.from))
                .concat(DEFAULT_GRAPH.edges.filter(e => generic_nodes.has(e.to))) 
        },
        hash: window.location.hash ?? "",
        html_id,
        dimensions: {
            x: document.getElementById(html_id).clientWidth,
            y: document.getElementById(html_id).clientHeight
        },
        examples,
        readonly: false, 
        hide_types: false,
        offset: {x: 0, y: 0}
    });

    return () => requestAnimationFrame(() => dispatch.dispatch(s => undefined));
}

export { runGraph, nodysseus };


// return links.map(link => _lib.no.executeGraph({...graph, in: '_' + link.source.node_child_id})(link_layout_map)(Object.assign({
//     readonly, 
//     show_all, 
//     link: Object.assign({edge: display_graph.edges.find(e => link.source.node_id === e.from && link.target.node_id === e.to)}, link),
//     selected_distance: levels.distance_from_selected.get(link.target.node_child_id) !== undefined ? Math.min(levels.distance_from_selected.get(link.target.node_child_id), levels.distance_from_selected.get(link.source.node_child_id)) : undefined, 
//     sibling_index_normalized: (levels.siblings.get(link.source.node_id).findIndex(n => n === link.source.node_id) + 1) / (levels.siblings.get(link.source.node_id).length + 1), _node_inputs})))