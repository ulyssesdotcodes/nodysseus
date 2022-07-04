import generic from "../public/json/generic.js";
import set from "just-safe-set";
import { diff } from "just-diff";
import { diffApply } from "just-diff-apply";
import loki from "lokijs";

let resfetch = typeof fetch !== "undefined" ? fetch : 
    (url, params) => import('https').then(https => new Promise((resolve, reject) => https.request(params, async response => {
            const buffer = [];
            for await(const chunk of response) {
                buffer.push(chunk);
            }
            const data = Buffer.concat(buffer).toString();
            resolve(data);
        })));

function nodysseus_get(obj, propsArg, defaultValue) {
    let objArg = obj;
    let level = 0;
  if (!obj) {
    return defaultValue;
  }
  var props, prop;
  if (Array.isArray(propsArg)) {
    props = propsArg.slice(0);
  }
  if (typeof propsArg == 'string') {
    props = propsArg.split('.');
  }
  if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }
  while (props.length) {
    if(obj && obj._Proxy) {
        obj = obj._value;
        continue;
    }
    prop = props.length == 0 ? props[0] : props.shift();
    if((obj === undefined || (obj[prop] === undefined && !obj.hasOwnProperty(prop))) && prop !== "args"){
        if(level === 0) {
            return objArg && objArg.__args ? nodysseus_get(objArg.__args, propsArg, defaultValue) : defaultValue;
        }
        return defaultValue;
    }

    if(ispromise(obj)) {
        obj = obj.then(v => v[prop]);
    } else {
        obj = obj[prop];
    }
    level += 1;
  }
  return obj;
}

function compare(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    /* eslint-disable no-self-compare */
    // if both values are NaNs return true
    if (value1 !== value1 && value2 !== value2) {
        return true;
    }
    if(!!value1 !== !!value2){
        return false;
    }
    if (value1._Proxy || value2._Proxy) {
        return false;
    }
    if (typeof value1 !== typeof value2) {
        return false;
    }
    if(typeof value1 === 'function' || typeof value2 === 'function') {
        // no way to know if context of the functions has changed
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
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        if(value1.fn && value1.fn === value2.fn 
            && compare(value1.graph, value2.graph)
            && compare(value1.args, value2.args)) {
            return true;
        }
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
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }

    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if(key === "__args" /*&& compare(value1[key], value2[key])*/){
            continue;
        }
        if (value1[key] === value2[key]) {
            continue;
        }

        return false
    }

    return true;
}

const hashcode = function (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    let i = str.length, ch;
    while (i > 0) {
        i--;
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const createProxy = (run_with_val, input, graphid, graph_input_value) => {
    let res = Object.create(null);
    let resolved = false;
    // return run_with_val(input.from)(graph_input_value);
    const proxy = new Proxy(res, {
        reset: () => {res = undefined; resolved = false;},
        get: (_, prop) => {
            if (prop === "_Proxy") {
                return true;
            } else if (prop === "_nodeid") {
                return input.from;
            } else if (prop === "_graphid") {
                return graphid;
            } else if (prop === "_needsresolve") {
                return true;
            } else if (prop === "_reset") {
                res = undefined;
                resolved = false;
                return false;
            }


            if (prop === 'toJSON') {
                return () => resolved ? res : { Proxy: input.from }
            }

            if (!resolved) {
                res = run_with_val(input.from)(graph_input_value);
                resolved = true;
            }

            if (prop === "_value") {
                return res
            } else if (!res) {
                return res;
            } else {
                if (typeof res[prop] === 'function') {
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

            return typeof res === 'object' ? Reflect.ownKeys(res) : [];
        },
        getOwnPropertyDescriptor: (target, prop) => {
            if (!resolved) {
                res = run_with_val(input.from)(graph_input_value);
                resolved = true;
            }
            const descriptor = Reflect.getOwnPropertyDescriptor(res, prop);
            if (descriptor && Array.isArray(res) && prop === 'length') {
                descriptor.configurable = true;
            }

            return typeof res === 'object' && !!res ? (descriptor || { value: get(target, prop) }) : undefined;
        }
    });

    return proxy;
}

const resolve = (o) => {
    if (o && o._Proxy) {
        const res = resolve(o._value);
        return res;
    } else if (Array.isArray(o)) {
        const new_arr = [];
        let same = true;
        let i = o.length;
        while (i > 0) {
            i--;
            new_arr[i] = resolve(o[i]);
            same = same && compare(o[i], new_arr[i]);
        }
        return same ? o : new_arr;
    } else if (typeof o === 'object' && !!o && o._needsresolve) {
        const keys = Object.keys(o);
        if (keys.length === 0) {
            return o;
        }

        let i = keys.length;
        let j = 0;
        let same = true;
        let new_obj = {};
        let promise = false;
        while (i > 0) {
            i--;
            if (keys[i] !== '_needsresolve') {
                const val = resolve(o[keys[i]]);
                new_obj[keys[i]] = val;
                same = same && o[keys[i]] === val;
                promise = promise || ispromise(val)
                j++;
            }
        }
        if (same) {
            delete o._needsresolve;
            return o;
        }
        if (promise) {
            return Promise.all(Object.entries(new_obj).map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v])))
                .then(kvs => Object.fromEntries(kvs))
        }
        return new_obj;
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
    if (typeof node.value !== 'string') {
        return node.value;
    }

    if(node.value === "undefined") {
        return undefined;
    }

    if(typeof node.value === "string") {
        if (node.value.startsWith('{') || node.value.startsWith('[')) {
            try {
                return JSON.parse(node.value.replaceAll("'", "\""));
            } catch (e) { }
        }

        if(node.value.match(/[0-9.]*/g)[0].length === node.value.length){
            if(node.value.includes(".")) {
                const int = parseInt(node.value);
                if (!isNaN(int)) {
                    return int;
                }
            }

            const float = parseFloat(node.value);
            if (!isNaN(float)) {
                return float;
            }
        }

        if (node.value === 'false' || node.value === 'true') {
            return node.value === 'true';
        }

    }

    return node.value;
}

const mockcombined = (data, graph_input_value) => {
    // if(!data.__args){
    //     data.__args = graph_input_value;
    //     // data._needsresolve = true;
    // }
    data.__args = graph_input_value
    return data;
    // TODO: remove after we're sure this works
    // return Object.assign({}, graph_input_value, data);
    // return new Proxy(data, {
    //     get: (something, prop) => {
    //         if(data.hasOwnProperty(prop) || prop === "_Proxy" || prop === "then" || prop === "__args" || prop === "_needsresolve") {
    //             return data[prop];
    //         }

    //         return graph_input_value[prop]
    //     },
    //     ownKeys: (_) => {
    //         const dkeys = Reflect.ownKeys(data);
    //         return dkeys.concat(Reflect.ownKeys(graph_input_value).filter(k => !dkeys.includes(k)));
    //     },
    //     getOwnPropertyDescriptor: (target, prop) => {

    //         const descriptor = Reflect.getOwnPropertyDescriptor(data, prop);

    //         return descriptor || Reflect.getOwnPropertyDescriptor(graph_input_value, prop);
    //     }
    // })
}

const node_nodes = (node, node_ref, graph_input_value, data, full_lib, graph, inputs) => {
    const outid = graph.id + "/" + node.id;
    const combined_data_input = typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) && data
        ? mockcombined(data, graph_input_value)
        : inputs.length > 0
            ? data
            : graph_input_value;


    const node_graph = Object.assign({}, node, {
        id: outid,
        node_id: node.id,
        out: node_ref.out,
        nodes: node_ref.nodes,
        edges: node_ref.edges
    });

    combined_data_input.result = full_lib.no.runtime.get_result(node_graph);
    full_lib.no.runtime.set_parent(node_graph, graph);

    const result = full_lib.no.runGraph(node_graph, node_ref.out || 'out', combined_data_input, full_lib);
    if(node_ref.id === "set_dropdown") {
        console.log('data');
        console.log(data)
    }
    if(nodysseus_get(data, 'edge.as') !== "display") {
        full_lib.no.runtime.update_result(node_graph, result);
    }
    return result;
}

const node_script = (node, node_ref, data, full_lib, graph, inputs) => {
    try {
        let orderedargs = "";
        for(let i of inputs) {
            if(i.as){
                orderedargs += ", " + i.as;
            }
        }
        node_ref = node_ref || full_lib.no.runtime.get_ref(graph, node.ref) || node;
        const fn = full_lib.no.runtime.get_fn(graph, `_lib, _node, _node_inputs, _graph${orderedargs}`, node.id, node_ref);

        let is_iv_promised = false;

        for(let i = 0; i < inputs.length; i++) {
            is_iv_promised = is_iv_promised || ispromise(data[inputs[i].as]);
        }

        const results = is_iv_promised
            ? Promise.all(inputs.map(iv => Promise.resolve(data[iv.as]))).then(iv => fn.apply(null, [full_lib, node, data, nolib.no.runtime.get_graph(graph), ...iv]))
            : fn.apply(null, [full_lib, node, data, nolib.no.runtime.get_graph(graph), ...inputs.map(i => data[i.as])]);

        return results;
    } catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        const parentest = full_lib.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        // if(parentest){
        //     while(full_lib.no.runtime.get_parent(error_node).id !== parentest.id) {
        //         error_node = full_lib.no.runtime.get_parent(error_node);
        //     }
        // }
        full_lib.no.runtime.publish.fn("grapherror", new NodysseusError(
            graph.id + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))
    }
}

const node_extern = (node, node_ref, node_id, data, full_lib, graph) => {
    const extern = nodysseus_get(full_lib, node_ref.extern);
    const args = extern.args.reduce((acc, arg) => {
        if (arg === '_node') {
            acc[0].push(node)
            return [acc[0], acc[1]];
        } else if (arg === '_node_inputs') {
            const res = extern.resolve ? resolve({ ...data, _needsresolve: true }) : data;
            if (Array.isArray(res)) {
                res.forEach(r => acc[0].push(r))
            } else {
                acc[0].push(res);
            }
            return [acc[0], acc[1]]
        } else if (arg === '_graph') {
            acc[0].push(graph);
            return [acc[0], acc[1]]
        } else if (arg == '_lib') {
            acc[0].push(full_lib);
            return [acc[0], acc[1]]
        }
        const value = extern.resolve === false ? data[arg] : resolve(data[arg]);
        acc[0].push(value)
        return [acc[0], ispromise(value) || acc[1]];
    }, [[], false]);

    try {

        if (args[1]) {
            return Promise.all(args[0]).then(as => {
                const res = extern.fn.apply(null, as);
                return res;
            })
        } else {
            const res = extern.fn.apply(null, args[0]);
            return res;
        }
    } catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        const parentest = full_lib.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        // if(parentest){
        //     while(full_lib.no.runtime.get_parent(error_node).id !== parentest.id) {
        //         error_node = full_lib.no.runtime.get_parent(error_node);
        //     }
        // }
        full_lib.no.runtime.publish.fn("grapherror", new NodysseusError(
            graph.id + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))
    }
}

const node_data = (data) => {
    let is_promise = false;
    let needsresolve = false;
    Object.entries(data).forEach(kv => {
        is_promise = is_promise || !!kv[1] && !kv[1]._Proxy && ispromise(kv[1]);
        needsresolve = needsresolve || kv[1]._needsresolve;
    })

    if (is_promise) {
        const promises = [];
        Object.entries(data).forEach(kv => {
            promises.push([kv[0], Promise.resolve(kv[1])])
        })
        return Promise.all(promises)
            .then(Object.fromEntries);
    }

    if(needsresolve) data._needsresolve = true;

    return data;
}

const create_data = (inputs, node_ref, graph, graph_input_value, full_lib) => {
    const data = {};
    let input;
    let _needsresolve = false;

    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];

        if (input.type === "ref") {
            if (!input.as) {
                throw new Error("references have to be named: " + node.id);
            }
            data[input.as] = input.from;
        } else {
            if (input.as) {
                const val = tryrun(input, node_ref, graph, graph_input_value, full_lib);
                data[input.as] = val;
                _needsresolve = _needsresolve || (val && (val._Proxy || val._needsresolve));
            }
        }
    }

    return [data, _needsresolve];
}

const tryrun = (input, node_ref, graph, graph_input_value, full_lib) => {

    if (input.type === "ref") {
        return input.from;
    } else if (input.type === "resolve") {
        // if(!node_map.has(input.from)) {
        //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
        // }

        return resolve(run_with_val(graph, full_lib)(input.from)(graph_input_value));
    } else if (!input.as || node_ref.script || node_ref.id === "script") {
        // if(!node_map.has(input.from)) {
        //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
        // }

        let res = run_with_val_full(graph, full_lib, input.from, graph_input_value);

        while (res && res._Proxy) {
            res = res._value;
        }

        return res;
    } else {
        return createProxy(run_with_val(graph, full_lib), input, graph.id, graph_input_value);
    }
}

const run_with_val_full = (graph, full_lib, node_id, graph_input_value) => {
        const cache_args = full_lib.no.runtime.get_args(graph);
        if(cache_args) {
            Object.assign(graph_input_value, cache_args);
        }

        let node = full_lib.no.runtime.get_node(graph, node_id);

        if (node === undefined) {
            throw new Error(`Undefined node_id ${node_id}`)
        }

        if (node.ref === "arg") {
            return full_lib.utility.arg.fn(node, graph, graph_input_value);
        }

        if (node.value !== undefined && !node.script && !node.ref && !node.nodes) {
            return node_value(node);
        }

        const inputs = full_lib.no.runtime.get_edges_in(graph, node_id);

        let node_ref;

        const ref = (node.ref && node.ref.node_ref) || typeof node.ref === 'string' ? node.ref : undefined;
        if (ref) {
            node_ref = full_lib.no.runtime.get_ref(graph, ref);
            if (!node_ref) {
                throw new Error(`Unable to find ref ${ref} for node ${node.name || node.id}`)
            }
        } else {
            node_ref = node;
        }

        // const input_data_map = new Map();
        const [data, _needsresolve] = create_data(inputs, node_ref, graph, graph_input_value, full_lib);

        if (node_ref.nodes || node_ref.script) {
            const res = node_ref.nodes 
                ? node_nodes(node, node_ref, graph_input_value, data, full_lib, graph, false, inputs) 
                : node_script(node, node_ref, data, full_lib, graph, inputs)

            if (typeof res === 'object' && !!res && !res._Proxy && !Array.isArray(res) && Object.keys(res).length > 0) {
                if (!!res._needsresolve) {
                    res._needsresolve = true;
                } else if (res.hasOwnProperty && res.hasOwnProperty("_needsresolve")) {
                    delete res._needsresolve;
                }
            }

            return res;
        } else if (node_ref.extern) {
            return node_extern(node, node_ref, node_id, data, full_lib, graph);
        }

        return node_data(data);
}

const run_with_val = (graph, full_lib) => node_id => (graph_input_value) => run_with_val_full(graph, full_lib, node_id, graph_input_value);

const executeGraph = ({ graph, lib }) => {
    const full_lib = lib ? lib.no ? lib : {...nolib, ...lib} : nolib;
    if(typeof graph === "string") {
        graph = full_lib.no.runtime.get_graph(graph);
    }

    if (graph._Proxy) {
        graph = graph._value;
    }

    if (!graph.nodes) {
        throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
    }

    return (node_id) => (graph_input_value) => resolve(run_with_val_full(graph, full_lib, node_id, graph_input_value));
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
    bfs(graph, (id, level) => levels.set(id, Math.min(levels.get(id) || Number.MAX_SAFE_INTEGER, level)))(top, 0);

    const parents = new Map(nodes.map(n => [n.node_id, links.filter(l => l.target.node_id === n.node_id).map(l => l.source.node_id)]));

    [...parents.values()].forEach(nps => {
        nps.sort((a, b) => parents.get(b).length - parents.get(a).length);
        for (let i = 0; i < nps.length * 0.5; i++) {
            if (i % 2 === 1) {
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
    const siblings = new Map(nodes.map(n => [n.node_id, [...(new Set(children.has(n.node_id)? children.get(n.node_id).flatMap(c => parents.get(c) || []) : [])).values()]]))
    const distance_from_selected = new Map();

    const connected_vertices = new Map(); //new Map(!fixed_vertices ? [] : fixed_vertices.nodes.flatMap(v => (v.nodes || []).map(n => [n, v.nodes])));

    const calculate_selected_graph = (s, i, c) => {
        const id = s;
        if (distance_from_selected.get(id) <= i) {
            return;
        }

        distance_from_selected.set(id, i);
        if(parents.has(s)) {
            parents.get(s).forEach(p => { calculate_selected_graph(p, i + 1, s); });
        }
        if(children.has(s)){
            children.get(s).forEach(c => { calculate_selected_graph(c, i + 1); });
        }
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


const objToGraph = (obj, path) => Object.entries(obj)
    .filter(e => e[0] !== '_value')
    .map(e => [e[0], typeof e[1] === 'object' && !!e[1] && !Array.isArray(e[1])
        ? Object.assign(e[1].hasOwnProperty('_value') ? { value: e[1]._value } : {}, objToGraph(e[1], path ? `${path}.${e[0]}` : e[0]))
        : { value: e[1] }]
    ).reduce((acc, n) => ({
        nodes: acc.nodes.concat(n[1].nodes || [])
            .concat([Object.assign({ id: path ? `${path}.${n[0]}` : n[0], name: n[0] },
                n[1].hasOwnProperty('value')
                    ? { value: n[1].value }
                    : n[1].hasOwnProperty('_value')
                        ? { value: n[1]._value }
                        : {})]),
        edges: acc.edges.concat(n[1].edges || []).concat(path ? [{ to: path, from: `${path}.${n[0]}` }] : [])
    })
        , { nodes: [], edges: [] });

/////////////////////////////////

const ispromise = a => a && a._Proxy ? false : a ? typeof a.then === 'function' : false;
const getmap = (map, id) => {
    return id ? map.get(id) : id;
}
const getorset = (map, id, value_fn) => {
    let val = map.get(id);
    if (val) {
        return val;
    } else {
        let val = value_fn();
        if (val !== undefined) {
            map.set(id, val);
        }
        return val
    }
}

const base_node = node => ({id: node.id, value: node.value, name: node.name, ref: node.ref});
const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})

const nolib = {
    just: {
        get: {
            args: ['_graph', 'target', 'path', 'def'],
            fn: (graph, target, path, def) => {
                return nodysseus_get(target && target._Proxy ? target._value : target, path && path._Proxy ? path._value : (path || graph.value), def && def._Proxy ? def._value : def);
            },
        },
        set: {
            args: ['target', 'path', 'value', '_node'],
            fn: (target, path, value, node) => {
                const keys = (path || node.value).split('.'); 
                const check = (o, v, k) => k.length === 1 
                    ? {...o, [k[0]]: v, _needsresolve: true} 
                    : o.hasOwnProperty(k[0]) 
                    ? {...o, [k[0]]: check(o[k[0]], v, k.slice(1)), _needsresolve: true} 
                    : o; 
                return check(target, value, keys)
            },
        },
        set_mutable: set,
        diff,
        diffApply
    },
    no: {
        executeGraphValue: ({ graph, lib }) => executeGraph({ graph, lib })(graph.out),
        executeGraphNode: ({ graph, lib }) => executeGraph({ graph, lib }),
        runGraph: (graph, node, args, lib) => {
            let rgraph = typeof graph === "string" ? nolib.no.runtime.get_graph(graph) : graph.graph ? graph.graph : graph;

            // if(!rgraph.nodes.find(n => n.id === "get") && nolib.no.runtime.get_parent(rgraph) === undefined) {
            //     rgraph = add_default_nodes_and_edges(rgraph);
            // }

            const res =  node !== undefined
                ? executeGraph({ graph: rgraph, lib })(node)(args || {})
                : executeGraph({ graph: rgraph, lib })(graph.fn)(graph.args || {})
            
            return res;
        },
        resolve,
        objToGraph,
        NodysseusError,
        runtime: (function(){
            const db = new loki("nodysseus.db", {env: "BROWSER", persistenceMethod:"memory"});
            const nodesdb = db.addCollection("nodes", {unique: ["id"]});
            const refsdb = db.addCollection("refs", {unique: ["id"]});
            const resultsdb = db.addCollection("results", {unique: ["id"]});
            generic.nodes.map(n => refsdb.insert(n));
            
            const parentdb = db.addCollection("parents", {unique: ["id"]});
            const new_graph_cache = (graph) => ({
                id: graph.id,
                graph,
                node_map: new Map(graph.nodes.map(n => [n.id, n])),
                in_edge_map: new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)])),
                args: {},
                fn_cache: new Map(),
                is_cached: new Set()
            });
            const event_listeners = new Map();
            const event_data = new Map();
            const getorsetgraph = (graph, id, path, valfn) => getorset(get_cache(graph)[path], id, valfn);
            let animationframe;
            const publish = (event, data) => {
                event_data.set(event, data);
                if (event === 'graphchange') {
                    const gcache = get_cache(data.id);
                    // cache.get(graph.id).graph = 
                    // gcache.graph = {...graph, out: gcache.graph.out || graph.out || 'main/out'};
                    gcache.graph = data;
                }

                const listeners = getorset(event_listeners, event, () => new Map());
                for (let l of listeners.values()) {
                    if (typeof l === 'function') {
                        l(data);
                    } else if (typeof l === 'object' && l.fn && l.graph) {
                        nolib.no.runGraph(l.graph, l.fn, Object.assign({}, l.args || {}, { data }), gcache.lib)
                    }
                }


                if(event === 'animationframe' && listeners.size > 0 && !animationframe) {
                    animationframe = requestAnimationFrame(() => {animationframe = false; publish('animationframe')});
                }

                return data;
            }

            const add_listener = (event, listener_id, input_fn, remove) => {
                const listeners = getorset(event_listeners, event, () => new Map());
                const fn = typeof input_fn === "function" ? input_fn : args => nolib.no.runGraph(input_fn.graph, input_fn.fn, Object.assign({}, input_fn.args, args))
                if(!listeners.has(listener_id)) {
                    requestAnimationFrame(() => {
                        if(event_data.has(event)) {
                            fn(event_data.get(event));
                        }
                    })
                }

                if (remove) {
                    remove_listener(event, listener_id);
                }

                listeners.set(listener_id, fn);

                if (event === 'animationframe') {
                    requestAnimationFrame(() => publish(event))
                }

                //TODO: rethink this maybe?
                // if (event !== 'graphchange') {
                //     add_listener('graphchange', 'rungraph', rungraph);
                // }
            }

            const remove_listener = (event, listener_id) => {
                if(event === "*") {
                    [...event_listeners.values()].forEach(e => e.delete(listener_id))
                } else {
                    const listeners = getorset(event_listeners, event, () => new Map());
                    listeners.delete(listener_id);
                }

                //TODO: rethink this maybe?
                // if (listeners.size === 0) {
                //     event_listeners.delete(event);
                //     if (event_listeners.size === 1 && event_listeners.has('graphchange')) {
                //         remove_listener('graphchange', 'rungraph');
                //     }
                // }
            }

            const delete_cache = (graph) => {
                const graphid = typeof graph === 'string' ? graph : graph.id;
                const nested = parentdb.find({"parent_id": graphid})
                nested.forEach(v => nodesdb.findAndRemove({"id": v.id}))
                const doc = nodesdb.by("id", graphid);
                if(doc){
                    nodesdb.remove(doc);
                }
            }

            const update_graph = (graph, args, lib) => {
                graph = resolve(graph);
                const new_cache = new_graph_cache(graph);
                const gcache = get_cache(graph.id);
                const old_graph = gcache && gcache.graph;

                const doc = get_cache(graph, new_cache);
                doc.graph = graph;
                doc.node_map = new_cache.node_map;
                doc.in_edge_map = new_cache.in_edge_map;
                doc.fn_cache = new_cache.fn_cache;
                doc.is_cached = new_cache.is_cached;
                if(lib){
                    doc.lib = lib;
                }

                if(args) {
                    const last_args = doc.args;
                    doc.args = {...last_args, ...args};
                }

                if(old_graph) {
                    for(const n of old_graph.nodes) {
                        if(get_node(graph, n.id) !== n) {
                            const nodegraphid = graph.id + "/" + n.id;
                            delete_cache(nodegraphid);
                        }
                    }
                }

                const parent = get_parent(graph);
                if(parent) {
                    update_graph(parent);
                } else {
                    const existing = refsdb.by("id", graph.id);
                    if(existing) {
                        console.log(`updating ${graph.id}`)
                        refsdb.update(Object.assign(existing, graph))
                    } else {
                        console.log(`inserting ${graph.id}`)
                        refsdb.insert(graph)
                    }
                    publish('graphchange', graph);
                }
            }

            const update_args = (graph, args) => {
                graph = resolve(graph);
                const gcache = get_cache(graph);

                if(gcache && args && !compare(gcache.args, args)) {
                    Object.assign(gcache.args, args);
                    publish('graphchange', get_parentest(graph) ?? graph);
                }
            }

            const get_ref = (graph, id) => {
                const parentest = get_parentest(graph);
                return refsdb.by("id", id) || (parentest ? get_ref(parentest, id) : get_node(graph, id));
            }
            const get_node = (graph, id) => getorsetgraph(graph, id, 'node_map', () =>
                get_graph(graph).nodes.find(n => n.id === id));
            const get_edge = (graph, from) => get_cache(graph).graph.edges.find(e => e.from === from);
            const get_edges_in = (graph, id) => getorsetgraph(graph, id, 'in_edge_map', () => graph.edges.filter(e => e.to === id));
            const get_edge_out = (graph, id) => get_cache(graph).graph.edges.find(e => e.from === id);
            const get_args = (graph) => get_cache(graph).args;
            const get_graph = (graph) => {
                const cached = get_cache(graph);
                return cached ? cached.graph : typeof graph !== "string" ? graph : undefined;
            }
            const get_parent = (graph) => {
                const parent = parentdb.by("id", typeof graph === "string" ? graph : graph.id);
                return parent ? get_graph(parent.parent_id) : undefined;
            }
            const get_parentest = (graph) => {
                const parent = parentdb.by("id", typeof graph === "string" ? graph : graph.id);
                return parent && parent.parentest_id && get_graph(parent.parentest_id);
            }
            const get_cache = (graph, newgraphcache) => {
                // if(graph && graph._needsresolve) {
                //     debugger;
                // }
                // graph = resolve(graph);
                const graphid = typeof graph === "string" ? graph : typeof graph === "object" ? graph.id : undefined;
                const lokiret = nodesdb.by("id", graphid);

                if(!lokiret && typeof graph === "object") {
                    const newcache = newgraphcache || new_graph_cache(graph);
                    nodesdb.insert(newcache);
                    return newcache;
                }

                return lokiret;
            }
            const get_path = (graph, path) => {
                    graph = get_graph(graph);
                    let pathSplit = path.split(".");
                    let node = graph.out || "main/out";
                    while(pathSplit.length > 0 && node) {
                        let pathval = pathSplit.shift();
                        const edge = get_edges_in(graph, node).find(e => e.as === pathval);
                        node = edge? edge.from : undefined;
                    } 
                    return node;
                }

            return {
                is_cached: (graph, id) => get_cache(graph.id),
                set_cached: (graph, id) => get_cache(graph.id).is_cached.add(id),
                get_ref,
                get_node,
                get_edge,
                get_edges_in,
                get_edge_out,
                get_parent,
                get_parentest,
                get_fn: (graph, orderedargs, id, node_ref) => 
                    getorsetgraph(graph, id, 'fn_cache', () => 
                        new Function(
                            `return function _${(node_ref.name ? node_ref.name.replace(/\W/g, "_") : node_ref.id)
                                .replace(/(\s|\/)/g, '_')}(${orderedargs}){${node_ref.script || node_ref.value}}`)()),
                update_graph,
                update_args,
                delete_cache,
                get_graph,
                get_args,
                get_path,
                refs: () => refsdb.where(() => true).map(v => v.id),
                edit_edge: (graph, edge, old_edge) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;

                    gcache.in_edge_map.delete((old_edge || edge).to);
                    edge.as = edge.as || 'arg0';
                    // const next_edge = !edge.as 
                    //     ? lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph}) 
                    //     : edge;

                    const new_graph = {
                        ...graph,
                        edges: graph.edges
                            .filter(e => !(e.to === (old_edge || edge).to && e.from === (old_edge || edge).from)).concat([edge])
                    }

                    update_graph(new_graph);
                },
                update_edges: (graph, add ,remove=[]) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;

                    const new_graph = {
                        ...graph,
                        edges: graph.edges.filter(e => !(remove.find(r => r.from === e.from && r.to === e.to))).concat(add)
                    }

                    update_graph(new_graph);
                },
                add_node: (graph, node) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;

                    const old_node = get_node(graph, node.id);
                    const in_edges = old_node && old_node.ref !== node.ref && get_edges_in(graph, node.id);
                    const node_ref = node.ref ? get_ref(graph, node.ref) : node;
                    const args = (node_ref.extern
                        ? nolib.just.get.fn({}, nolib, node_ref.extern).args
                        : node_ref.nodes 
                        ? node_ref.nodes.filter(n => n.ref === "arg").map(n => n.value)
                        : []).filter(a => !a.includes('.') && !a.startsWith("_"));
                    const unused_args = args && args.length > 0 && in_edges && args.filter(a => !in_edges.find(e => e.as === a));
                    const nonargs_edges = args && args.length > 0 && in_edges && in_edges.filter(e => !args.find(a => e.as === a));

                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter(n => n.id !== node.id).concat([node]),
                        edges: !nonargs_edges ? graph.edges : 
                            graph.edges.filter(e => !nonargs_edges.find(ae => e.to === ae.to && e.from === ae.from))
                                .concat(nonargs_edges.map((e, i) => i < unused_args.length ? ({...e, as: unused_args[i]}) : e))
                    };

                    console.log(new_graph)

                    // n.b. commented out because it blasts update_args which is not desirable
                    // delete_cache(graph)
                    update_graph(new_graph);
                },
                delete_node: (graph, id) => {
                    const gcache = get_cache(graph);
                    graph = gcache.graph;

                    const parent_edge = graph.edges.find(e => e.from === id);
                    const child_edges = graph.edges.filter(e => e.to === id);

                    const current_child_edges = graph.edges.filter(e => e.to === parent_edge.to);
                    const new_child_edges = child_edges.map((e, i) => ({ ...e, to: parent_edge.to, as: i === 0 ? parent_edge.as : !e.as ? e.as : current_child_edges.find(ce => ce.as === e.as && ce.from !== id) ? e.as + '1' : e.as }));

                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter(n => n.id !== id),
                        edges: graph.edges.filter(e => e !== parent_edge && e.to !== id).concat(new_child_edges)
                    }

                    update_graph(new_graph);
                },
                add_listener,
                add_listener_extern: {
                    args: ['event', 'listener_id', 'fn'],
                    add_listener,
                },
                remove_listener,
                publish: {
                    args: ['event', 'data'],
                    fn: (event, data) => publish(event, data)
                },
                update_result: (graph, result) => {
                    const old = resultsdb.by("id", graph.id);
                    if(old){
                        resultsdb.update(Object.assign(old, {data: result}))
                    } else {
                        resultsdb.insert({id: graph.id, data: result})
                    }
                },
                get_result: (graph) => {
                    return resultsdb.by("id", graph.id)?.data;
                },
                set_parent: (graph, parent) => {
                    const parent_parent = parentdb.by("id", parent.id) 
                    const parentest_id = (parent_parent ? parent_parent.parentest_id : false) || parent.id;
                    const existing = parentdb.by("id", graph.id)
                    const new_parent = {id: graph.id, parent_id: parent.id, parentest_id};
                    if(existing){
                        Object.assign(existing, new_parent)
                        parentdb.update(existing)
                    } else {
                        parentdb.insert(new_parent)
                    }
                },
                animate: () => {
                    publish("animationframe");
                    requestAnimationFrame(() => nolib.no.runtime.animate())
                }
            }
        })()
    },
    utility: {
        compare,
        eq: ({ a, b }) => a === b,
        arg: {
            args: ['_node', '_graph', 'target'],
            resolve: false,
            fn: (node, graph, target) => {
                return typeof node.value === 'string'
                ?   node.value === '_args'
                    ? target
                    : node.value === '_graph'
                    ? graph
                    : node.value === '_node'
                    ? node
                    : node.value.startsWith('_graph.')
                    ? nodysseus_get(graph, node.value.substring('_graph.'.length))
                    : node.value.startsWith('_node.')
                    ? nodysseus_get(node, node.value.substring('_node.'.length))
                    : nodysseus_get(target, node.value)
                : node.value !== undefined && target !== undefined
                    ? target[node.value]
                    : undefined
            },
        },
        liftarraypromise: (array) => {
            const isarraypromise = array.reduce((acc, v) => acc || ispromise(v), false);
            return isarraypromise ? Promise.all(array) : array;
        },
        script: {
            args: ['_node', '_node_inputs', '_graph', '_lib'],
            fn: (node, node_inputs, graph, _lib) => 
                node_script(node, node, node_inputs, _lib, graph, _lib.no.runtime.get_edges_in(graph, node.id))
        },
        new_array: {
            args: ['_node_inputs', '_node'],
            resolve: false,
            fn: (args, node) => {
                const argskeys = Object.keys(args);
                const arr = args && argskeys.length > 0
                    ? argskeys
                        .sort()
                        .reduce((acc, k) => [
                            acc[0].concat([args[k]]),
                            acc[1] || ispromise(args[k])
                        ], [[], false])
                    : JSON.parse("[" + node.value + "]");
                return arr[1] ? Promise.all(arr[0]) : arr[0];
            }
        },
        fetch: {
            args: ['_node', 'url', 'params'],
            fn: (node, url, params) => resfetch(url || node.value, params)
        },
        call: {
            args: ['_node', 'self', 'fn', 'args', '_args'],
            fn: (node, self, fn, args) => typeof self === 'function' 
                ? Array.isArray(args) 
                    ? self(...(args
                        .reverse()
                        .reduce((acc, v) => [
                            !acc[0] && v !== undefined, acc[0] || v !== undefined 
                            ? acc[1].concat([v]) 
                            : acc[1]
                        ], [false, []])[1]
                        .reverse()))
                    : self(args) 
                : Array.isArray(args) 
                    ? nodysseus_get(self, fn || node.value).apply(self, (args || [])
                        .reverse()
                        .reduce((acc, v) => [
                            !acc[0] && v !== undefined, acc[0] || v !== undefined 
                            ? acc[1].concat([v]) 
                            : acc[1]
                        ], [false, []])[1]
                        .reverse())
                    : nodysseus_get(self, fn || node.value).apply(self, [args])
        },
        merge_objects: {
            args: ['_node_inputs'],
            resolve: false,
            fn: (args) => {
                const keys = Object.keys(args).sort();
                const promise = keys.reduce((acc, k) => acc || ispromise(args[k]), false);
                return promise
                    ? Promise.all(keys.map(k => Promise.resolve(args[k])))
                        .then(es => Object.assign({}, ...es.map(k => args[k] && args[k]._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object')))
                    : Object.assign({}, ...keys.map(k => args[k] && args[k]._Proxy ? args[k]._value : args[k]).filter(a => a && typeof a === 'object'))
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
            args: ['object', 'spacer'],
            resolve: true,
            fn: (obj, spacer) => JSON.stringify(obj, null, spacer)
        },
        parse: {
            args: ['string'],
            resolve: true,
            fn: (args) => JSON.parse(args)
        }
    },
    // THREE
};

const generic_nodes = new Set(generic.nodes.map(n => n.id));

const add_default_nodes_and_edges = g => ({
    ...g,
    nodes: g.nodes
        .filter(n => !generic_nodes.has(n.id))
        .concat(generic.nodes)
})

const runGraph = (graph, node, args, lib) => {
    if(typeof graph === "object") {
        nolib.no.runtime.update_graph(graph.graph ?? graph)
    }

    return nolib.no.runGraph(graph, node, args, lib);
}

export { nolib, runGraph, objToGraph, bfs, calculateLevels, compare, hashcode, add_default_nodes_and_edges, ispromise, resolve, NodysseusError, base_graph, base_node, resfetch };
