import DEFAULT_GRAPH from "../public/json/pull.json"
import set from "just-safe-set";
import { diff } from "just-diff";
import { diffApply } from "just-diff-apply";
import Fuse from "fuse.js";

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
      if(!propsArg.includes('.')) {
          props = [propsArg];
      } else {
        props = propsArg.split('.');
      }
  }
  if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }
  while (props.length) {
    if(obj?._Proxy) {
        obj = obj._value;
        continue;
    }
    prop = props.shift();
    if(obj === undefined || !obj.hasOwnProperty(prop)){
        if(level === 0) {
            return objArg?.__args ? nodysseus_get(objArg.__args, propsArg, defaultValue) : defaultValue;
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
    if (value1?._Proxy || value2?._Proxy) {
        return false;
    }
    if (typeof value1 !== typeof value2) {
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

const createProxy = (run_with_val, input, graph_input_value, is_node_cached, usecache, cache) => {
    let res = Object.create(null);
    let resolved = false;
    // return run_with_val(input.from)(graph_input_value);
    if (usecache && cache) {
        const cached = cache.get(input.from + '+proxy');
        if (usecache && is_node_cached && cached && compare(graph_input_value, cached[1])) {
            console.log('proxy cache');
            return cached[0];
        }
    }

    const proxy = new Proxy(res, {
        get: (_, prop) => {
            if (prop === "_Proxy") {
                return true;
            } else if (prop === "_nodeid") {
                return input.from;
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

    if (usecache) {
        cache.set(input.from, [proxy, graph_input_value]);
    }

    return proxy;
}

const resolve = (o, cache, is_node_cached) => {
    if (o?._Proxy) {
        const res = resolve(o._value);
        if (!(cache && is_node_cached)) {
            return res;
        }
        const cached = cache.get(o._nodeid + '+resolve');
        if (compare(res, cached)) {
            // console.log('cached resolve');
            // console.log(o._nodeid);
            return cached;
        }
        cache.set(o._nodeid + '+resolve', res);
        return res;
    } else if (Array.isArray(o)) {
        const new_arr = [];
        let same = true;
        let i = o.length;
        while (i > 0) {
            i--;
            new_arr[i] = resolve(o[i], cache, is_node_cached);
            same = same && compare(o[i], new_arr[i]);
        }
        return same ? o : new_arr;
    } else if (typeof o === 'object' && !!o && o._needsresolve) {
        const entries = Object.entries(o);
        if (entries.length === 0) {
            return o;
        }

        let i = entries.length;
        let j = 0;
        let same = true;
        let new_obj_entries = [];
        let promise = false;
        while (i > 0) {
            i--;
            if (entries[i][0] !== '_needsresolve') {
                new_obj_entries[j] = [entries[i][0], resolve(entries[i][1], cache, is_node_cached)];
                same = same && entries[i][1] === new_obj_entries[j][1]
                promise = promise || ispromise(new_obj_entries[j][1])
                j++;
            }
        }
        if (same) {
            delete o._needsresolve;
            return o;
        }
        if (promise) {
            return Promise.all(new_obj_entries.map(kv => Promise.resolve(kv[1]).then(v => [kv[0], v])))
                .then(kvs => Object.fromEntries(kvs))
        }
        const res = Object.fromEntries(new_obj_entries);
        return res;
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

    if (typeof node.value === 'string' && node.value.match(/[0-9]*/g)[0].length === node.value.length) {
        const int = parseInt(node.value);
        if (!isNaN(int)) {
            return int;
        }
    }

    if (typeof node.value === 'string' && node.value.match(/[0-9.]*/g)[0].length === node.value.length) {
        const float = parseFloat(node.value);
        if (!isNaN(float)) {
            return float;
        }
    }

    if (node.value === 'false' || node.value === 'true') {
        return node.value === 'true';
    }

    if (node.value.startsWith('{') || node.value.startsWith('[')) {
        try {
            return JSON.parse(node.value.replaceAll("'", "\""));
        } catch (e) { }
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
    return new Proxy(data, {
        get: (something, prop) => {
            if(data.hasOwnProperty(prop) || prop === "_Proxy" || prop === "then" || prop === "__args" || prop === "_needsresolve") {
                return data[prop];
            }

            return graph_input_value[prop]
        },
        ownKeys: (_) => {
            const dkeys = Reflect.ownKeys(data);
            return dkeys.concat(Reflect.ownKeys(graph_input_value).filter(k => !dkeys.includes(k)));
        },
        getOwnPropertyDescriptor: (target, prop) => {

            const descriptor = Reflect.getOwnPropertyDescriptor(data, prop);

            return descriptor ?? Reflect.getOwnPropertyDescriptor(graph_input_value, prop);
        }
    })
}

const node_nodes = (node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    const outid = graph.id + "/" + node.id;
    const keys = node_ref.nodes.filter(n => n.ref === 'arg').map(n => n.value);
    const combined_data_input = typeof graph_input_value === 'object' && !Array.isArray(graph_input_value) && data
        ? mockcombined(data, graph_input_value)
        : inputs.length > 0
            ? data
            : graph_input_value;

    let hit = false;
    // if (!full_lib.no.runtime.get_node(graph, outid)) {
    //     full_lib.no.runtime.expand_node(graph, node.id, node_ref);
    // }

    if (usecache && is_node_cached && cache.get(cache_id).has(outid)) {
        const val = cache.get(cache_id).get(outid);
        hit = compare(val[1], combined_data_input, keys);
        if (hit) {
            console.log('nodes hit')
            return val[0];
        }
    }

    // const res = run_with_val(outid)(combined_data_input)
    const node_graph = {
        ...node, 
        id: outid,
        node_id: node.id,
        nodes: node_ref.nodes,
        edges: node_ref.edges
    };
    full_lib.no.runtime.set_parent(node_graph, graph);
    const res = full_lib.no.runGraph(node_graph, node_ref.out ?? 'out', combined_data_input, full_lib);
    // console.log(resolve(combined_data_input));
    // console.log(res);
    if (typeof res === 'object' && !!res && !res._Proxy && !Array.isArray(res) && Object.keys(res).length > 0) {
        if (_needsresolve || !!res._needsresolve) {
            res._needsresolve = !!res._needsresolve || _needsresolve;
        } else if (res.hasOwnProperty("_needsresolve")) {
            delete res._needsresolve;
        }
    }

    if (usecache) {
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
    for (let a of argset) {
        input_values.push(
            a === '_node'
                ? node
                : a === '_lib'
                    ? full_lib
                    : a === '_node_inputs'
                        ? data
                        : a === '_graph'
                            ? nolib.no.runtime.get_graph(graph)
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
        if (usecache) {
            cache.get(cache_id).set(node.id, [results, data]);
        }
        // }

        if (typeof results === 'object' && !!results && !results._Proxy && !Array.isArray(results) && Object.keys(results).length > 0) {
            if (_needsresolve || !!results._needsresolve) {
                results._needsresolve = !!results._needsresolve || _needsresolve;
            } else if (results.hasOwnProperty("_needsresolve")) {
                delete results._needsresolve;
            }
        }

        return results;
    } catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        console.dir(node_ref);
        console.log(data);
        throw new AggregateError([
            new NodysseusError(
                node.id,
                e instanceof AggregateError ? "Error in node chain" : e
            )]
            .concat(e instanceof AggregateError ? e.errors : []));
    }
}

const node_extern = (node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    const extern = nodysseus_get(full_lib, node_ref.extern);
    const args = extern.args.reduce((acc, arg) => {
        if (arg === '_node') {
            acc[0].push(node)
            return [acc[0], acc[1]];
        } else if (arg === '_node_inputs') {
            const res = extern.resolve ? resolve({ ...data, _needsresolve: true }, usecache && cache.get(cache_id), is_node_cached) : data;
            if (Array.isArray(res)) {
                res?.forEach(r => acc[0].push(r))
            } else {
                acc[0].push(res);
            }
            return [acc[0], acc[1]]
        } else if (arg === '_graph') {
            acc[0].push(graph);
            return [acc[0], acc[1]]
        }
        const value = extern.resolve === false ? data[arg] : resolve(data[arg], usecache && cache.get(cache_id), is_node_cached);
        acc[0].push(value)
        return [acc[0], ispromise(value) || acc[1]];
    }, [[], false]);

    try {
        if (usecache && is_node_cached && !extern.nocache && cache.get(cache_id).has(node.id)) {
            const val = cache.get(cache_id).get(node.id);
            let hit = compare(args[0], val[1]);
            // hit = hit && compare(graph_input_value, val[2]);
            if (hit) {
                return val[0]
            }
        }

        if (args[1]) {
            return Promise.all(args[0]).then(as => {
                const res = extern.fn.apply(null, as);
                if (usecache) {
                    cache.get(cache_id).set(node_id, [res, args[0]])
                }
                return res;
            })
        } else {
            const res = extern.fn.apply(null, args[0]);
            if (usecache) {
                cache.get(cache_id).set(node_id, [res, args[0]])
            }
            return res;
        }
    } catch (e) {
        throw new AggregateError([
            new NodysseusError(
                node_id, 
                e instanceof AggregateError ? "Error in node chain" : e
            )]
            .concat(e instanceof AggregateError ? e.errors : []));
    }
}

const node_data = (node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve) => {
    if (usecache && is_node_cached && cache.get(cache_id).has(node.id)) {
        const val = cache.get(cache_id).get(node.id);
        let hit = compare(data, val);
        // hit = hit && compare(graph_input_value, val[2]);
        if (hit) {
            console.log('data hit');
            return val;
        }
    }


    if (typeof data === 'object' && !!data && !data._Proxy && !Array.isArray(data) && Object.keys(data).length > 0) {
        data._needsresolve = true;
    }

    let is_promise = false;
    Object.entries(data).forEach(kv => {
        is_promise = is_promise || !!kv[1] && !kv[1]._Proxy && ispromise(kv[1]);
    })

    if (is_promise) {
        const promises = [];
        Object.entries(data).forEach(kv => {
            promises.push([kv[0], Promise.resolve(kv[1])])
        })
        return Promise.all(promises)
            .then(Object.fromEntries)
            .then(res => (usecache ? cache.get(cache_id).set(node.id, [res, data]) : undefined, res));
    }

    if (usecache) {
        cache.get(cache_id).set(node.id, [data, data]);
    }

    return data;
}

const create_input_data_map = (inputs, tryrun) => {
    const input_data_map = {};
    let i = inputs.length;
    while (i > 0) {
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

const executeGraph = ({ cache, graph, lib, cache_id, usecache }) => {
    const full_lib = lib ? lib.no ? lib : {...nolib, ...lib} : nolib;
    usecache = usecache ?? true;

    if (!graph.nodes) {
        throw new Error(`Graph has no nodes! in: ${graph.in} out: ${graph.out}`)
    }

    if (graph._Proxy) {
        graph = graph._value;
    }

    const run_with_val = (node_id) => {
        return (graph_input_value, cache_id_node) => {

            const cache_args = full_lib.no.runtime.get_args(graph);
            if(cache_args) {
                Object.assign(graph_input_value, cache_args);
            }
            
            // let is_node_cached = full_lib.no.runtime.is_cached(graph, node_id);
            let is_node_cached = true;
            let node = full_lib.no.runtime.get_node(graph, node_id);
            // full_lib.no.runtime.set_cached(graph, node_id);

            if (node === undefined) {
                throw new Error(`Undefined node_id ${node_id}`)
            }

            if (node.ref === "arg") {
                return full_lib.utility.arg.fn(node, graph_input_value);
            }

            if (node.value !== undefined && !node.script && !node.ref && !node.nodes) {
                return node_value(node);
            }

            cache_id = cache_id_node ?? cache_id;
            if (!cache.has(cache_id)) {
                cache.set(cache_id, new Map([["__handles", 1]]));
            } else {
                // cache.get(cache_id).set("__handles", cache.get(cache_id).get("__handles") + 1);
            }

            const inputs = full_lib.no.runtime.get_edges_in(graph, node_id);

            let node_ref;

            const ref = node.ref?.node_ref ?? typeof node.ref === 'string' ? node.ref : undefined;
            if (ref) {
                node_ref = full_lib.no.runtime.get_ref(graph, ref);
                if (!node_ref) {
                    throw new Error(`Unable to find ref ${ref} for node ${node.name ?? node.id}`)
                }
            } else {
                node_ref = node;
            }

            let _needsresolve = false;

            const tryrun = (input) => {
                if (input.type === "ref") {
                    return input.from;
                } else if (input.type === "resolve") {
                    // if(!node_map.has(input.from)) {
                    //     throw new Error(`Input not found ${input.from} for node ${node_id}`)
                    // }

                    return resolve(run_with_val(input.from)(graph_input_value), usecache && cache.get(cache_id), is_node_cached);
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
                    return createProxy(run_with_val, input, graph_input_value, is_node_cached, false, cache.get(cache_id));
                }
            }


            // const input_data_map = new Map();
            const input_data_map = create_input_data_map(inputs, tryrun);
            const data = create_data(inputs, input_data_map);

            if (node_ref.nodes) {
                return node_nodes(node, node_ref, cache, graph_input_value, data, full_lib, graph, false, is_node_cached, run_with_val, inputs, cache_id, _needsresolve)
            } else if (node_ref.script) {
                return node_script(node, node_ref, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve)
            } else if (node_ref.extern) {
                return node_extern(node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve);
            }


            return node_data(node, node_ref, node_id, cache, graph_input_value, data, full_lib, graph, usecache, is_node_cached, run_with_val, inputs, cache_id, _needsresolve);
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
    const slash_index = data.node_id.lastIndexOf('/');
    const node_id = slash_index >= 0 ? data.node_id.substring(0, slash_index) : data.node_id;
    if (!node.nodes) {
        const inside_nodes = [Object.assign({}, node)];
        const inside_node_map = new Map();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set();

        const q = data.display_graph.edges.filter(e => e.to === inside_nodes[0].id);

        let in_edge = [];
        let args_edge;

        while (q.length > 0) {
            const e = q.shift();

            if(e.to === node.id && e.as === 'args') {
                args_edge = e;
            }

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

            if (e.from !== args_edge?.from) {
                nolib.no.runtime.get_edges_in(data.display_graph, e.from).forEach(de => q.push(de));
            }
        }

        let in_node_id = args_edge?.from;

        // just return the original graph if it's a single node 
        if (in_edge.find(ie => ie.to !== in_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node_id = data.node_id;

        const in_node = inside_node_map.get(in_node_id);

        let node_id_count = data.display_graph.nodes.filter(n => n.id === node_id).length;
        let final_node_id = node_id_count === 0 ? node_id : `${node_id}_${node_id_count}`

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
                    value: node.value,
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
        ? Object.assign(e[1].hasOwnProperty('_value') ? { value: e[1]._value } : {}, objToGraph(e[1], path ? `${path}.${e[0]}` : e[0]))
        : { value: e[1] }]
    ).reduce((acc, n) => ({
        nodes: acc.nodes.concat(n[1].nodes ?? [])
            .concat([Object.assign({ id: path ? `${path}.${n[0]}` : n[0], name: n[0] },
                n[1].hasOwnProperty('value')
                    ? { value: n[1].value }
                    : n[1].hasOwnProperty('_value')
                        ? { value: n[1]._value }
                        : {})]),
        edges: acc.edges.concat(n[1].edges ?? []).concat(path ? [{ to: path, from: `${path}.${n[0]}` }] : [])
    })
        , { nodes: [], edges: [] });

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
    "ancestors",

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
    "events_broadcast_channel",
    "input_value",
    "ancestors",
    "return",

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

const nolib = {
    just: {
        get: {
            args: ['target', 'path', 'def'],
            fn: (target, path, def) => {
                return nodysseus_get(target?._Proxy ? target._value : target, path?._Proxy ? path._value : path, def?._Proxy ? def._value : def);
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
            ? executeGraph({ graph, cache, cache_id: "main", lib })(node)(args)
            : executeGraph({ graph: graph.graph, cache, cache_id: "main", lib })(graph.fn)(graph.args),
        resolve,
        objToGraph,
        NodysseusError,
        runtime: (function(){
            const cache = new Map(); 
            const new_graph_cache = (graph) => ({
                graph,
                node_map: new Map(graph.nodes.map(n => [n.id, n])),
                in_edge_map: new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.to === n.id)])),
                parent: undefined,
                args: false,
                fn_cache: new Map(),
                is_cached: new Set()
            });
            const event_listeners = new Map();
            const getorsetgraph = (graph, id, path, valfn) => getorset(getorset(cache, graph.id, () => new_graph_cache(graph))[path], id, valfn);
            const publish = (graph, event, data) => {
                const gcache = cache.get(graph.id);
                if (event === 'graphchange') {
                    // cache.get(graph.id).graph = 
                    // gcache.graph = {...graph, out: gcache.graph.out ?? graph.out ?? 'main/out'};
                    gcache.graph = graph;
                }

                const listeners = getorset(event_listeners, event, () => new Map());
                for (let l of listeners.values()) {
                    if (typeof l === 'function') {
                        l(graph, data);
                    } else if (typeof l === 'object' && l.fn && l.graph) {
                        nolib.no.runGraph(l.graph, l.fn, Object.assign({}, l.args ?? {}, { data }), gcache.lib)
                    }
                }
            }

            const rungraph = graph => {
                if (!self.cancelAnimationFrame) {
                    self.cancelAnimationFrame = clearTimeout;
                }
                self.cancelAnimationFrame(cache.get(graph.id).animrun)
                if (!self.requestAnimationFrame) {
                    self.requestAnimationFrame = fn => setTimeout(() => fn(), 16);
                }
                cache.get(graph.id).animrun = self.requestAnimationFrame(() => {
                    try {
                        graph = resolve(graph);
                        const gcache = cache.get(graph.id);
                        graph = gcache.graph ?? graph;

                        const result = nolib.no.runGraph(graph, graph.out ?? 'out', get_args(graph), gcache.lib);
                        Promise.resolve(result).then(res => {
                            publish(graph,'graphrun', res);
                        }).catch(e => publish(graph, 'grapherror', e))
                    } catch (e) {
                        publish(graph, 'grapherror', e);
                    }
                })
            }

            const add_listener = (event, listener_id, fn, remove) => {
                if (remove) {
                    remove_listener(event, listener_id);
                }

                const listeners = getorset(event_listeners, event, () => new Map());
                listeners.set(listener_id, fn);

                //TODO: rethink this maybe?
                if (event !== 'graphchange') {
                    add_listener('graphchange', 'rungraph', rungraph);
                }
            }

            const remove_listener = (event, listener_id) => {
                const listeners = event_listeners.get(event);
                listeners.delete(listener_id);

                //TODO: rethink this maybe?
                if (listeners.size === 0) {
                    event_listeners.delete(event);
                    if (event_listeners.size === 1 && event_listeners.has('graphchange')) {
                        remove_listener('graphchange', 'rungraph');
                    }
                }
            }

            const update_graph = (graph, args, lib) => {
                graph = resolve(graph);
                const new_cache = new_graph_cache(graph);
                getorset(cache, graph.id, () => new_cache).node_map = new_cache.node_map;
                getorset(cache, graph.id, () => new_cache).in_edge_map = new_cache.in_edge_map;
                getorset(cache, graph.id, () => new_cache).fn_cache = new_cache.fn_cache;
                getorset(cache, graph.id, () => new_cache).is_cached = new_cache.is_cached;
                if(lib){
                    getorset(cache, graph.id, () => new_cache).lib = lib;
                }
                if(args) {
                    const last_args = getorset(cache, graph.id, () => new_cache).args;
                    getorset(cache, graph.id, () => new_cache).args = {...last_args, ...args};
                }
                publish(graph, 'graphchange');
            }

            const get_ref = (graph, id) => cache.get(graph.id)?.parent ? 
                get_ref(cache.get(graph.id)?.parent, id) : get_node(graph, id)
            const get_node = (graph, id) => getorsetgraph(resolve(graph), id, 'node_map', () =>
                get_graph(graph).nodes.find(n => n.id === id) 
                    ?? (cache.get(graph.id)?.parent ? get_ref(graph, id) : undefined));
            const get_edges_in = (graph, id) => getorsetgraph(resolve(graph), id, 'in_edge_map', () => graph.edges.filter(e => e.to === id));
            const get_args = (graph) => getorset(cache, graph.id, () => new_graph_cache(graph)).args;
            const get_graph = (graph) => cache.get(graph.id).graph ?? graph;

            return {
                is_cached: (graph, id) => getorset(cache, graph.id, () => new_graph_cache(graph)).is_cached.has(id),
                set_cached: (graph, id) => getorset(cache, graph.id, () => new_graph_cache(graph)).is_cached.add(id),
                get_ref,
                get_node,
                get_edges_in,
                get_parent: (graph) => cache.get(graph.id)?.parent,
                get_fn: (graph, orderedargs, node_ref) => getorsetgraph(resolve(graph), orderedargs + node_ref.id, 'fn_cache', () => new Function(`return function _${(node_ref.name?.replace(/\W/g, "_") ?? node_ref.id).replace(/(\s|\/)/g, '_')}(${orderedargs}){${node_ref.script}}`)()),
                update_graph,
                get_graph,
                get_args,
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
                update_args: (graph, args) => { 
                    getorset(cache, graph.id, () => new_graph_cache(graph)).args = {...(args ?? {}), ...(cache.get(graph.id).args ?? {})};
                },
                add_node: (graph, node, edge) => {
                    // Add the node to the graph, making sure to use the right node_id at every level.
                    // The added node has to not have the parent id
                    // The parent might have slashes in it
                    let node_id = node.id;
                    let new_node = node;
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
                    graph = gcache.graph;
                    do {
                        let nest_up_id = gcache.parent_map.get(node_id);
                        if (nest_up_id) {
                            new_node = {
                                ...new_node,
                                id: new_node.id.substring(nest_up_id.length + 1)
                            };
                            const nest_up = get_node(graph, nest_up_id);
                            if(!nest_up){
                                update_graph(graph);
                                return;
                            }
                            new_node = {
                                ...nest_up,
                                nodes: nest_up.nodes.filter(n => n.id !== new_node.id).concat([new_node])
                            };
                        }
                        node_id = nest_up_id;
                    } while (node_id);

                    const new_graph = {
                        ...graph,
                        nodes: graph.nodes.filter(n => n.id !== new_node.id).concat([new_node]),
                        edges: edge ? graph.edges.filter(e => !(e.from === edge.from && e.to === edge.to)).concat(edge) : graph.edges
                    };

                    update_graph(new_graph);
                },
                delete_node: (graph, id) => {
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
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
                    args: ['_graph', 'event', 'data'],
                    fn: publish
                },
                set_parent: (graph, parent) => {
                    const gcache = getorset(cache, graph.id, () => new_graph_cache(resolve(graph)));
                    gcache.parent = parent;
                }
            }
        })()
    },
    utility: {
        compare,
        eq: ({ a, b }) => a === b,
        arg: {
            args: ['_node', 'target'],
            resolve: false,
            fn: (node, target) => {
                return typeof node.value === 'string'
                ? node.value === '_args'
                    ? target
                    : nodysseus_get(target, node.value)
                : node.value === '_graph'
                    ? graph
                    : node.value === '_node'
                        ? node
                        : node.value !== undefined && target !== undefined
                            ? target[node.value]
                            : undefined
            },
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
            fn: (fn, args, self) => typeof self === 'function' 
                ? self(...((args ?? [])
                    .reverse()
                    .reduce((acc, v) => [
                        !acc[0] && v !== undefined, acc[0] || v !== undefined 
                        ? acc[1].concat([v]) 
                        : acc[1]
                    ], [false, []])[1]
                    .reverse())) 
                : self[fn](...((args ?? [])
                    .reverse()
                    .reduce((acc, v) => [
                        !acc[0] && v !== undefined, acc[0] || v !== undefined 
                        ? acc[1].concat([v]) 
                        : acc[1]
                    ], [false, []])[1]
                    .reverse()))
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

export { nolib, runGraph, objToGraph, flattenNode, bfs, calculateLevels, compare, hashcode, contract_all, contract_node, expand_node, add_default_nodes_and_edges, ispromise, resolve, NodysseusError };
