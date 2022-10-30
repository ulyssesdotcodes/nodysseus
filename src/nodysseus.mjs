import generic from "../public/json/generic.js";
import set from "just-safe-set";
import loki from "lokijs";

let resfetch = typeof fetch !== "undefined" ? fetch : 
    (urlstr, params) => import('node:https').then(https => new Promise((resolve, reject) => {
        const url = new URL(urlstr);
        const req = https.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: params.headers,
            method: params.method.toUpperCase()
        }, async response => {
            const buffer = [];
            for await(const chunk of response) {
                buffer.push(chunk);
            }
            const data = Buffer.concat(buffer).toString();
            resolve(data);
        })
        if(params.body) {
            req.write(params.body)
        }
        req.end();
    }));

function nodysseus_get(obj, propsArg, lib, defaultValue) {
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
    props = /\./.test(propsArg) ? propsArg.split('.') : [propsArg];
  }
  if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
    props = [propsArg];
  }
  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }
  while (props.length) {
    if(obj) {
        const ran = run_runnable(obj, lib)
        if(obj !== ran || ran.__value) {
          obj = ran.__value;
          continue;
        }
    }

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r)
    }

    prop = props.length == 0 ? props[0] : props.shift();
    if((obj === undefined || typeof obj !== 'object' || (obj[prop] === undefined && !(obj.hasOwnProperty && obj.hasOwnProperty(prop))))){
        return objArg && objArg.__args ? nodysseus_get(objArg.__args, propsArg, lib, defaultValue) : defaultValue;
    }

    obj = obj[prop];

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r)
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
        if (node.value.startsWith('"') && node.value.endsWith('"')) {
            return node.value.substring(1, node.value.length - 1)
        }

        if (node.value.startsWith('{') || node.value.startsWith('[')) {
            try {
                return JSON.parse(node.value.replaceAll("'", "\""));
            } catch (e) { }
        }

        if(node.value.match(/-?[0-9.]*/g)[0].length === node.value.length){
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
    data.__args = graph_input_value
    return data;
}

const node_nodes = (node, node_id, data, graph_input_value, lib, inputs) => {
    // data = Object.fromEntries(Object.entries(data).map(e => [e[0], e[1]]))
    return run_graph(node, node_id, mockcombined(data, graph_input_value), lib)
}

const node_script = (node, nodeArgs, lib) => {
    let orderedargs = "";
    const data = {};
    let is_iv_promised = false;
    for(let i of Object.keys(nodeArgs)) {
        orderedargs += ", " + i;
        if(nodeArgs[i] !== undefined){
            const graphval = run_runnable(nodeArgs[i], lib);
            // TODO: figure out how to now wrap
            data[i] = graphval // ?? graphval// run_runnable(graphval, lib);
            is_iv_promised ||= ispromise(graphval);
        }
    }

    const name = node.name ? node.name.replace(/\W/g, "_") : node.id;
    const fn = lib.no.runtime.get_fn(node.id, name, `_lib, _node, _graph_input_value${orderedargs}`, node.script ?? node.value);

    const result = is_iv_promised
        ? Promise.all(Object.keys(nodeArgs).map(iv => Promise.resolve(data[iv]))).then(ivs => lib.no.of(fn.apply(null, [lib, node, data, ...ivs.map(iv => iv.__value)])))
        : lib.no.of(fn.apply(null, [lib, node, data, ...Object.values(data).map(d => d.__value)]));
    
    return result;
}

const node_extern = (node, data, graphArgs, lib) => {
    const extern = nodysseus_get(lib, node.ref === "extern" ? node.value : node_ref.value, lib);
    const args = extern.args ?  extern.args.reduce((acc, arg) => {
        let newval;
        if (arg === '_node') {
            newval = node 
        } else if (arg === '_node_args') {
            newval = extern.rawArgs ? data : Object.fromEntries(Object.entries(data).filter(d => !d[0].startsWith("__")).map(d => [d[0], run_runnable(d[1], lib).__value]));
        } else if (arg == '_lib') {
            newval = lib;
        } else if (arg == '_graph_input_value') {
            newval = graphArgs;
        } else {
            newval = extern.rawArgs ? data[arg] : run_runnable(data[arg], lib)
            newval = ispromise(newval) ? newval.then(v => v?.__value) : newval && !extern.rawArgs ? newval.__value : newval;
        }

        acc[0].push(newval)
        return [acc[0], ispromise(newval) || acc[1]];
    }, [[], false]) : resolve_args(data, lib);

    if (args[1]) {
        return Promise.all(args[0]).then(as => {
            const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, as);
            return extern.rawArgs ? res : lib.no.of(res);
        })
    } else {
        const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, args[0]);
        return extern.rawArgs ? res : lib.no.of(res);
    }
}

const resolve_args = (data, lib) => {
    let is_promise = false;
    const result = {}
    Object.entries(data).forEach(kv => {
      result[kv[0]] = run_runnable(kv[1], lib);
      is_promise = is_promise || !!kv[1] && ispromise(result[kv[0]]);
    })

    if (is_promise) {
        const promises = [];
        Object.entries(result).forEach(kv => {
            promises.push(Promise.resolve(kv[1]).then(pv => [kv[0], pv?.__value]))
        })
        return Promise.all(promises).then(Object.fromEntries).then(v => lib.no.of(v));
    }

    return lib.no.of(Object.fromEntries(Object.entries(result).map(e => [e[0], e[1]?.__value])));

}

const node_data = (nodeArgs, graphArgs, lib) => {
    return resolve_args(nodeArgs, lib);
}

// derives data from the args symbolic table
const create_data = (graph, inputs, graphArgs, lib) => {
    const data = {};
    let input;
    //TODO: remove
    const newgraphargs = graphArgs._output ? {...graphArgs, _output: undefined} : graphArgs;// {...graphArgs};
    // delete newgraphargs._output

    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];

        // lgraph.out = input.from;
        const val = {graph, fn: input.from, args: newgraphargs, isArg: true, __isnodysseus: true} //run_graph(lgraph, input.from, graphArgs, lib);
        data[input.as] = val;
    }

    return data;
}

const run_runnable = (runnable, lib) => 
    !runnable?.__isnodysseus
    ? runnable
    : runnable?.fn && runnable?.graph 
    ? run_graph(runnable.graph, runnable.fn, runnable.args ?? {}, lib)
    : runnable?.id
    ? run_node(runnable, {}, {}, lib)
    : runnable

// graph, node, symtable, parent symtable, lib
const run_node = (node, nodeArgs, graphArgs, lib) => {
    if (node.ref) {

        if (node.ref === "arg") {
            // const val = nolib.no.arg(node, graphArgs, lib, node.value);
            const resval = nolib.no.arg(node, graphArgs, lib, node.value);
            return resval && typeof resval === 'object' && Object.hasOwn(resval, "__value") ? resval : lib.no.of(resval);
        } else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib)
        } else if (node.ref === "script") {
            return node_script(node, nodeArgs, lib)
        }

        let node_ref = lib.no.runtime.get_ref(node.ref);

        if (!node_ref) {
            throw new Error(`Unable to find ref ${ref} for node ${node.name || node.id}`)
        }

        const newGraphArgs = {_output: nodysseus_get(graphArgs, "_output", lib)};
        if(node_ref.nodes) {
            const graphid = nodysseus_get(graphArgs, "__graphid", lib)?.__value;
            const newgraphid = (graphid ? graphid + "/" : "") + node.id
            const current = lib.no.runtime.get_graph(newgraphid);
            lib.no.runtime.set_parent(newgraphid, graphid); // before so that change/update has the parent id
            if(current?.refid !== node_ref.id){
              lib.no.runtime.change_graph({...node_ref, id: newgraphid, refid: node_ref.id})
            } else {
              lib.no.runtime.update_graph(newgraphid)
            }
            Object.assign(newGraphArgs, {__graphid: lib.no.of(newgraphid)})
        }

        return run_node(node_ref, {...nodeArgs, __graph_value: lib.no.of(node.value)}, newGraphArgs, lib)
    } else if (node.nodes) {
        // const data = Object.fromEntries(Object.entries(nodeArgs).map(e => [e[0], e[1]]))
        // const graphid = nodysseus_get(graphArgs, "__graphid");
        // const graphid = nodysseus_get(graphArgs, "__graphid");
        // const nodegraphargs = graph.args ?? {}
        // nodegraphargs.__graphid = (graphid ? graphid + "/" : "") + node.graph.id;

        return node_nodes(node, node.out ?? "out", nodeArgs, graphArgs, lib)
    } else if (node.fn && node.graph) {
        const graphid = nodysseus_get(graphArgs, "__graphid", lib)?.__value;
        const nodegraphargs = node.args ?? {}
        nodegraphargs.__graphid = graphid ?? lib.no.of(node.graph.id);
        nodegraphargs._output = nodysseus_get(graphArgs, "_output", lib)

        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib)
    } else if (node.script){
        // deprecated
        // const data = Object.fromEntries(Object.entries(nodeArgs)
        //     .filter(e => e[1] !== undefined)
        //     .map(e => [e[0], run_graph(e[1].graph, e[1].fn, e[1].args, lib)]))
        return node_script(node, nodeArgs, lib)
    } else if(Object.hasOwn(node, "value")) {
        return lib.no.of(node_value(node));
    } else if (Object.hasOwn(node, "__value")){
        return node;
    } else {
        return node_data(nodeArgs, graphArgs, lib)
    }
}

// handles graph things like edges
const run_graph = (graph, node_id, graphArgs, lib) => {
    // const cache_args = lib.no.runtime.get_args(graph);
    // const result = lib.no.runtime.get_result(graph);

    // if(cache_args) {
    //     Object.assign({}, nodeArgs, cache_args, result ? {result} : {});
    // }

    const node = lib.no.runtime.get_node(graph, node_id);

    try {
        const inputs = lib.no.runtime.get_edges_in(graph, node_id);

        // Check for duplicates
        if(new Set(inputs.map(e => e.as)).size !== inputs.size) {
            const as_set = new Set()
            inputs.forEach(e => {
                if (as_set.has(e.as)) {
                    throw new NodysseusError(graph.id + "/" + node_id, `Multiple input edges have the same label "${e.as}"`)
                }
                as_set.add(e.as)
            })
        }


        lib.no.runtime.publish('noderun', {graph, node_id})

        const data = create_data(graph, inputs, graphArgs, lib);
        return run_node(node, data, graphArgs, lib, graph);
    } catch (e) {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        if(e instanceof NodysseusError) {
            lib.no.runtime.publish("grapherror", e)
            return;
        }
        const parentest = lib.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        lib.no.runtime.publish("grapherror", new NodysseusError(
            graph.id + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))
    }
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
                n[1]?.hasOwn?.('value')
                    ? { value: n[1].value }
                    : n[1]?.hasOwn?.('_value')
                        ? { value: n[1]._value }
                        : {})]),
        edges: acc.edges.concat(n[1].edges || []).concat(path ? [{ to: path, from: `${path}.${n[0]}` }] : [])
    })
        , { nodes: [], edges: [] });

/////////////////////////////////

const ispromise = a => a && typeof a.then === 'function';
const isrunnable = a => a && ((a.value && a.id && !a.ref) || a.fn && a.graph);
const isgraph = g => g && g.out !== undefined && g.nodes !== undefined && g.edges !== undefined
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

const base_node = node => node.ref || node.extern ? ({id: node.id, value: node.value, name: node.name, ref: node.ref, extern: node.extern}) : base_graph(node);
const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})

const nolib = {
  no: {
    of: (value) => ispromise(value) ? value.then(nolib.no.of) : value?.__value ? value : { id: "out", __value: value, __isnodysseus: true },
    arg: (node, target, lib, value) => {
      const typedvalue = value.split(": ");
      const nodevalue = typedvalue[0];
      const newtarget = () => {
        const newt = Object.assign({}, target.__args);
        Object.keys(newt).forEach(k => k.startsWith("_") && delete newt[k])
        return newt;
      };
      // const named_args = graph.nodes.filter(n => n.ref === "arg").map(n => n.value);
      const ret = nodevalue === undefined || target === undefined
        ? undefined
        : nodevalue === "_node"
        ? node
        : nodevalue.startsWith("_node.")
        ? nodysseus_get(node, nodevalue.substring("_node.".length), lib)
        : nodevalue.startsWith("_lib.")
        ? nodysseus_get(lib, nodevalue.substring("_lib.".length), lib)
        : nodevalue === "_args"
        ? newtarget()
        : nodysseus_get(
            node.type === "local" || node.type?.includes?.("local")
              ? newtarget()
              : node.type === "parent" || node.type?.includes?.("parent")
              ? target.__args
              : target,
            nodevalue,
            lib
          );

      const retrun = ret?.isArg && typedvalue[1] !== "raw" ? run_runnable(ret, lib) : undefined;
      return ispromise(retrun) ? retrun.then(v => v?.__value) : retrun ? retrun?.__value : ret;
    },
    base_graph,
    base_node,
    objToGraph,
    NodysseusError,
    runtime: (function () {
      const db = new loki("nodysseus.db", {
        env: "BROWSER",
        persistenceMethod: "memory",
      });
      const nodesdb = db.addCollection("nodes", { unique: ["id"] });
      const refsdb = db.addCollection("refs", { unique: ["id"] });
      const resultsdb = db.addCollection("results", { unique: ["id"] });
      const inputdatadb = db.addCollection("inputdata", { unique: ["id"] });
      const argsdb = db.addCollection("args", { unique: ["id"] });
      const fndb = db.addCollection("fns", { unique: ["id"] });
      generic.nodes.map((n) =>
        refsdb.insert({ id: n.id ?? n.graph.id, data: n })
      );

      const parentdb = db.addCollection("parents", { unique: ["id"] });
      const new_graph_cache = (graph) => ({
        id: graph.id,
        graph,
        node_map: new Map(graph.nodes.map((n) => [n.id, n])),
        in_edge_map: new Map(
          graph.nodes.map((n) => [
            n.id,
            graph.edges.filter((e) => e.to === n.id),
          ])
        ),
        is_cached: new Set(),
      });
      const event_listeners = new Map();
      const event_listeners_by_graph = new Map();
      const event_data = new Map(); // TODO: get rid of this
      const getorsetgraph = (graph, id, path, valfn) =>
        getorset(get_cache(graph)[path], id, valfn);
      let animationframe;
      const publish = (event, data, lib) => {

        const runpublish = (data) => {
          event_data.set(event, data);
          if (event === "graphchange") {
            const gcache = get_cache(data.id);
            // cache.get(graph.id).graph =
            // gcache.graph = {...graph, out: gcache.graph.out || graph.out || 'out'};
            gcache.graph = data;
          }

          const listeners = getorset(event_listeners, event, () => new Map());
          for (let l of listeners.values()) {
            if (typeof l === "function") {
              l(data);
            } else if (typeof l === "object" && l.fn && l.graph) {
              run_graph(
                l.graph,
                l.fn,
                Object.assign({}, l.args || {}, { data }),
                lib
              );
            }
          }

          if (
            event === "animationframe" &&
            listeners.size > 0 &&
            !animationframe
          ) {
            animationframe = requestAnimationFrame(() => {
              animationframe = false;
              publish("animationframe");
            });
          }
        };

        if (typeof data === "object" && ispromise(data)) {
          data.then(runpublish);
        } else {
          runpublish(data);
        }

        return data;
      };

      const add_listener = (
        event,
        listener_id,
        input_fn,
        remove,
        graph_id,
        prevent_initial_trigger,
        lib
      ) => {
        const listeners = getorset(event_listeners, event, () => new Map());
        const fn =
          typeof input_fn === "function"
            ? input_fn
            : (args) => {
                run_graph(input_fn.graph, input_fn.fn, {
                  ...args,
                  __args: input_fn.args,
                }, lib);
              };
        if (!listeners.has(listener_id)) {
          if (!prevent_initial_trigger) {
            requestAnimationFrame(() => {
              if (event_data.has(event)) {
                fn(event_data.get(event));
              }
            });
          }

          if (graph_id) {
            const graph_id_listeners = getorset(
              event_listeners_by_graph,
              graph_id,
              () => new Map()
            );
            graph_id_listeners.set(event, listener_id);
          }
        }

        if (remove) {
          remove_listener(event, listener_id);
        }

        listeners.set(listener_id, fn);

        if (event === "animationframe") {
          requestAnimationFrame(() => publish(event));
        }

        //TODO: rethink this maybe?
        // if (event !== 'graphchange') {
        //     add_listener('graphchange', 'rungraph', rungraph);
        // }
      };

      const remove_listener = (event, listener_id) => {
        if (event === "*") {
          [...event_listeners.values()].forEach((e) => e.delete(listener_id));
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
      };

      const remove_graph_listeners = (graph_id) => {
        const graph_listeners = event_listeners_by_graph.get(graph_id);
        if (graph_listeners) {
          for (const evt of graph_listeners.entries()) {
            getorset(event_listeners, evt[0])?.delete(evt[1]);
          }
        }
      };

      const delete_cache = (graph) => {
        if (graph) {
          const graphid = typeof graph === "string" ? graph : graph.id;
          const nested = parentdb.find({ parent_id: graphid });
          nested.forEach((v) => nodesdb.findAndRemove({ id: v.id }));
          const doc = nodesdb.by("id", graphid);
          if (doc) {
            nodesdb.remove(doc);
          }
        } else {
          argsdb.clear();
          event_data.clear();
          resultsdb.clear();

          // event_listeners.clear()
          // event_listeners_by_graph.clear()
        }
      };

      const change_graph = (graph, args, lib) => {
        const new_cache = new_graph_cache(graph);
        const gcache = get_cache(graph.id);
        const old_graph = gcache && gcache.graph;

        const doc = get_cache(graph, new_cache);
        doc.graph = graph;
        doc.node_map = new_cache.node_map;
        doc.in_edge_map = new_cache.in_edge_map;
        doc.is_cached = new_cache.is_cached;
        if (lib) {
          doc.lib = lib;
        }

        if (args) {
          const last_args = doc.args;
          doc.args = { ...last_args, ...args };
        }

        if (old_graph) {
          for (const n of old_graph.nodes) {
            if (get_node(graph, n.id) !== n) {
              const nodegraphid = graph.id + "/" + n.id;
              delete_cache(nodegraphid);
            }
          }
        }

        const parent = get_parentest(graph);
        if (parent) {
          change_graph(parent);
        } else {
          const existing = refsdb.by("id", graph.id);
          if (existing) {
            refsdb.update(Object.assign(existing, { data: graph.__isnodysseus ? graph : {...graph, __isnodysseus: true} }));
          } else {
            refsdb.insert({ id: graph.id, data: graph.__isnodysseus ? graph : {...graph, __isnodysseus: true} });
          }
          publish("graphchange", graph);
          publish("graphupdate", graph);
        }
      };

      const update_args = (graph, args) => {
        const graphid = typeof graph === "string" ? graph : graph.id;
        let prevargs = argsdb.by("id", graphid) ?? {};

        if (!prevargs.data) {
          prevargs.id = graphid;
          prevargs.data = {};
          argsdb.insert(prevargs);
        }

        if (!compare(prevargs.data, args)) {
          Object.assign(prevargs.data, args);
          const fullgraph = get_graph(graphid);
          publish("graphupdate", get_parentest(fullgraph) ?? fullgraph);
        }
      };

      const get_ref = (id) => {
        return refsdb.by("id", id)?.data;
      };
      const add_ref = (graph) => {
        const existing = refsdb.by("id", graph.id);
        if(existing) {
          refsdb.update(Object.assign(existing, {data: graph}))
        } else {
          refsdb.insert({id: graph.id, data: graph})
        }
      } 
      const remove_ref = (id) => {
        const existing = refsdb.by("id", id);
        if(existing) {
          refsdb.remove(Object.assign(existing, {data: graph}))
        }
      };
      const get_node = (graph, id) =>
        getorsetgraph(graph, id, "node_map", () =>
          get_graph(graph).nodes.find((n) => n.id === id)
        );
      const get_edge = (graph, from) =>
        get_cache(graph).graph.edges.find((e) => e.from === from);
      const get_edges_in = (graph, id) =>
        getorsetgraph(graph, id, "in_edge_map", () =>
          graph.edges.filter((e) => e.to === id)
        );
      const get_edge_out = (graph, id) =>
        get_cache(graph).graph.edges.find((e) => e.from === id);
      const get_args = (graph) =>
        argsdb.by("id", typeof graph === "string" ? graph : graph.id)?.data ??
        {};
      const get_graph = (graph) => {
        const cached = get_cache(graph);
        return cached
          ? cached.graph
          : typeof graph !== "string"
          ? graph
          : undefined;
      };
      const get_parent = (graph) => {
        const parent = parentdb.by(
          "id",
          typeof graph === "string" ? graph : graph.id
        );
        return parent ? get_graph(parent.parent_id) : undefined;
      };
      const get_parentest = (graph) => {
        const parent = parentdb.by(
          "id",
          typeof graph === "string" ? graph : graph.id
        );
        return parent && parent.parentest_id && get_graph(parent.parentest_id);
      };
      const get_cache = (graph, newgraphcache) => {
        // graph = resolve(graph);
        const graphid =
          typeof graph === "string"
            ? graph
            : typeof graph === "object"
            ? graph.id
            : undefined;
        const lokiret = nodesdb.by("id", graphid);

        if (!lokiret && typeof graph === "object") {
          const newcache = newgraphcache || new_graph_cache(graph);
          nodesdb.insert(newcache);
          return newcache;
        }

        return lokiret;
      };
      const get_path = (graph, path) => {
        graph = get_graph(graph);
        let pathSplit = path.split(".");
        let node = graph.out || "out";
        while (pathSplit.length > 0 && node) {
          let pathval = pathSplit.shift();
          const edge = get_edges_in(graph, node).find((e) => e.as === pathval);
          node = edge ? edge.from : undefined;
        }
        return node;
      };

      return {
        is_cached: (graph, id) => get_cache(graph.id),
        set_cached: (graph, id) => get_cache(graph.id).is_cached.add(id),
        get_ref,
        add_ref,
        remove_ref,
        get_node,
        get_edge,
        get_edges_in,
        get_edge_out,
        get_parent,
        get_parentest,
        get_fn: (id, name, orderedargs, script) => {
          const fnid = id + orderedargs;
          let fn = fndb.by("id", fnid);
          if (!fn || fn.script !== script) {
            const update = !!fn;

            fn = Object.assign(fn ?? {}, {
              id: fnid,
              script,
              fn: new Function(
                `return function _${name.replace(
                  /(\s|\/)/g,
                  "_"
                )}(${orderedargs}){${script}}`
              )(),
            });

            if (update) {
              fndb.update(fn);
            } else {
              fndb.insert(fn);
            }
          }

          return fn.fn;
        },
        change_graph,
        update_graph: (graphid) => publish('graphupdate', {graphid}),
        update_args,
        delete_cache,
        get_graph,
        get_args,
        get_path,
        refs: () => refsdb.where(() => true).map((v) => v.id),
        ref_graphs: () => refsdb.where(() => true).filter((v) => v.data.out && get_node(v.data, v.data.out).ref === "return").map(v => v.id),
        edit_edge: (graph, edge, old_edge) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          gcache.in_edge_map.delete((old_edge || edge).to);
          edge.as = edge.as || "arg0";
          // const next_edge = !edge.as
          //     ? lib.no.runGraph(cache.get('nodysseus_hyperapp').graph, 'next_edge', {edge, graph})
          //     : edge;

          const new_graph = {
            ...graph,
            edges: graph.edges
              .filter(
                (e) =>
                  !(
                    e.to === (old_edge || edge).to &&
                    e.from === (old_edge || edge).from
                  )
              )
              .concat([edge]),
          };

          change_graph(new_graph);
        },
        update_edges: (graph, add, remove = []) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          const new_graph = {
            ...graph,
            edges: graph.edges
              .filter(
                (e) => !remove.find((r) => r.from === e.from && r.to === e.to)
              )
              .concat(add),
          };

          change_graph(new_graph);
        },
        add_node: (graph, node) => {
          if (!(node && typeof node === "object" && node.id)) {
            throw new Error(`Invalid node: ${JSON.stringify(node)}`);
          }

          const gcache = get_cache(graph);
          graph = gcache.graph;

          const new_graph = {
            ...graph,
            nodes: graph.nodes.filter((n) => n.id !== node.id).concat([node]),
          };

          // n.b. commented out because it blasts update_args which is not desirable
          // delete_cache(graph)
          change_graph(new_graph);
        },
        delete_node: (graph, id) => {
          const gcache = get_cache(graph);
          graph = gcache.graph;

          const parent_edge = graph.edges.find((e) => e.from === id);
          const child_edges = graph.edges.filter((e) => e.to === id);

          const current_child_edges = graph.edges.filter(
            (e) => e.to === parent_edge.to
          );
          const new_child_edges = child_edges.map((e, i) => ({
            ...e,
            to: parent_edge.to,
            as:
              i === 0
                ? parent_edge.as
                : !e.as
                ? e.as
                : current_child_edges.find(
                    (ce) => ce.as === e.as && ce.from !== id
                  )
                ? e.as + "1"
                : e.as,
          }));

          const new_graph = {
            ...graph,
            nodes: graph.nodes.filter((n) => n.id !== id),
            edges: graph.edges
              .filter((e) => e !== parent_edge && e.to !== id)
              .concat(new_child_edges),
          };

          change_graph(new_graph);
        },
        add_listener,
        add_listener_extern: {
          args: ["event", "listener_id", "fn"],
          add_listener,
        },
        remove_listener,
        remove_graph_listeners,
        publish: (event, data) => publish(event, data),
        update_result: (graph, result) => {
          const graphid = typeof "graph" === "string" ? graph : graph.id;
          const old = resultsdb.by("id", graphid);
          if (ispromise(result)) {
            result.then((r) => nolib.no.runtime.update_result(graphid, r));
          } else if (old) {
            resultsdb.update(Object.assign(old, { data: result }));
          } else {
            resultsdb.insert({ id: graphid, data: result });
          }
        },
        get_result: (graph) => {
          return resultsdb.by(
            "id",
            typeof graph === "string" ? graph : graph.id
          )?.data;
        },
        update_inputdata: (graph, inputdata) => {
          const old = inputdatadb.by("id", graph.id);
          if (old) {
            inputdatadb.update(Object.assign(old, { data: inputdata }));
          } else {
            inputdatadb.insert({ id: graph.id, data: inputdata });
          }
        },
        get_inputdata: (graph) => {
          return inputdatadb.by("id", graph.id)?.data;
        },
        set_parent: (graph, parent) => {
          const graphid = graph;
          const parentid = parent;
          const parent_parent = parentdb.by("id", parentid);
          const parentest_id =
            (parent_parent ? parent_parent.parentest_id : false) || parentid;
          const existing = parentdb.by("id", graphid);
          const new_parent = {
            id: graphid,
            parent_id: parentid,
            parentest_id,
          };
          if (existing) {
            Object.assign(existing, new_parent);
            parentdb.update(existing);
          } else {
            parentdb.insert(new_parent);
          }
        },
        animate: () => {
          publish("animationframe");
          requestAnimationFrame(() => nolib.no.runtimeuanimate());
        },
      };
    })(),
  },
  extern: {
    // runGraph: F<A> => A
    ap: {
      rawArgs: true,
      args: ["fn", "args", "run", "_lib", "_graph_input_value"],
      fn: (fn, args, run, lib, graph_input_value) => {
        // debugger;
        const runvalue = run_runnable(run, lib)?.__value;
        const execute = (fn, fnr, rv, av) => {
          if(fnr === undefined) {
            return lib.no.of(undefined)
          }
          if(av?.fn && av?.graph) {
            av = run_runnable({...av, args: {...av.args, ...fn.args}}, lib)?.__value
          }
          const fnap = {
            ...fnr,
            args: {
              // ...fn.args.__args,
              ...fnr.args,
              ...av,
              __graphid: nodysseus_get(fnr.args, "__graphid"),
              __args: {...fn.args.__args},
            },
          };

          return rv ? run_runnable(fnap, lib) : lib.no.of(fnap);
        }

        const execpromise = (fn, fnrg, rvg, avg) => {
          const fnv = fnrg;//run_runnable(fnrg, lib);
          const rv = run_runnable(rvg, lib);
          const av = run_runnable(avg, lib);
          if(ispromise(fnv) || ispromise(rv) || ispromise(av)) {
            return Promise.all([fnv, rv, av]).then(([fnr, rv, av]) => execute(fn, fnr?.__value, rv?.__value, av?.__value))
          }

          return execute(fn, fnv?.__value, rv?.__value, av?.__value)
        }

        if(runvalue) {
          // debugger;
        }

        const fnv = run_runnable(fn, lib);

        return runvalue ? execpromise(fn, fnv, run, args)
          : (delete args?.isArg, delete args?.args?._output, lib.no.of({
            "fn": "runfn",
            "graph": {
              "id": `run_${fn.fn}`,
              "nodes": [
                {"id": "fnarg", "ref": "arg", "value": "fnr"},
                {"id": "argsarg", "ref": "arg", "value": "argsr"},
                {"id": "run", "value": "true"},
                {"id": "runfn", "ref": "ap"}
              ],
              "edges": [
                {"from": "fnarg", "to": "runfn", "as": "fn"},
                {"from": "run", "to": "runfn", "as": "run"},
                {"from": "argsarg", "to": "runfn", "as": "args"}
              ]
            },
            "args": { fnr: fnv?.__value, argsr: args },
            "__isnodysseus": true,
          }))
      }
    },
    create_fn: {
      args: ["runnable", "_lib"],
      fn: (runnable, lib) => (args) => {
        const __args = runnable.args.__args;
        runnable.args = args;
        runnable.args.__args = __args;
        return run_runnable(runnable, lib)?.__value
      }
    },
    switch: {
      rawArgs: true,
      args: ["input", "_node_args", "_lib"],
      fn: (input, args, lib) => {
        const inputval = run_runnable(input, lib).__value;
        return run_runnable(args[inputval], lib);
      },
    },
    resolve: {
        rawArgs: false,
        args: ['object', '_lib'],
        fn: (object, lib) => {
            return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]));
        }
    },
    fold: {
      rawArgs: true,
      args: ["fn", "object", "initial", "_lib"],
      fn: (fn, object, initial, lib) => {
        if(Array.isArray(object) || ispromise(object)) {
          debugger;
        }
        const foldvalue = objectvalue => {
          // object = run_node(run_node(object, {}, object.args, _lib), {}, {}, _lib);
          if (objectvalue === undefined) return undefined;
          const fnrunnable = fn; //run_runnable(fn, _lib)

          const mapobjarr = (mapobj, mapfn, mapinit) =>
            Array.isArray(mapobj)
              ? mapobj.reduce(mapfn, mapinit)
              : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit);

          initial = run_runnable(initial, lib)?.__value ?? (Array.isArray(objectvalue) ? [] : {});
          
          const ret = mapobjarr(
            objectvalue,
            (previousValue, currentValue) =>
              run_graph(
                fnrunnable.graph,
                fnrunnable.fn,
                mockcombined(
                {previousValue: lib.no.of(previousValue), currentValue: lib.no.of(currentValue) },
                fnrunnable.args),
                lib
              ).__value,
            initial
          );
          return lib.no.of(ret);
        }
        const objectvalue = run_runnable(object, lib);


        return ispromise(objectvalue) ? objectvalue.then(ov => foldvalue(ov.__value)) : foldvalue(objectvalue.__value)
      },
    },
    sequence: {
      rawArgs: true,
      args: ["_node_args", "_lib"],
      fn: (_args, lib) => {
        // debugger;
        // return Object.entries(_args).filter(e => e[0] !== "args").map(e => run_runnable(run_runnable(e[1], lib), lib))
        const delayfn = (fn, args) => lib.no.of({
            "fn": "runfn",
            "graph": {
              "id": `run_${fn.fn}`,
              "nodes": [
                {"id": "fnarg", "ref": "arg", "value": "fn"},
                {"id": "argsarg", "ref": "arg", "value": "args"},
                {"id": "run", "value": "true"},
                {"id": "runfn", "ref": "ap"}
              ],
              "edges": [
                {"from": "fnarg", "to": "runfn", "as": "fn"},
                {"from": "run", "to": "runfn", "as": "run"},
                {"from": "argsarg", "to": "runfn", "as": "args"}
              ]
            },
            "args": { fn: fn?.__value, args }
          })
        return lib.no.of(Object.entries(_args).filter(e => e[0] !== "args").map(e => delayfn(run_runnable(e[1], lib), _args.args)))
      }
    },
    runnable: {
      rawArgs: true,
      args: ["fn", "_lib"],
      fn: (fn, lib) => {
        if(!fn) {
          return lib.no.of(undefined);
        }
        delete fn.isArg;
        return lib.no.of(fn);
      },
    },
    entries: {
      args: ["object"],
      fn: (obj) => {
        return Object.entries(obj);
      },
    },
    fromEntries: {
      args: ["entries"],
      fn: (entries) => {
        return Object.fromEntries(entries);
      },
    },
    return: {
      resolve: false,
      rawArgs: true,
      args: [
        "value",
        "display",
        "subscribe",
        "argslist",
        "args",
        "lib",
        "_node",
        "_graph",
        "_graph_input_value",
        "_lib",
      ],
      fn: (
        value,
        display,
        subscribe,
        argslist,
        argsfn,
        lib,
        _node,
        _graph,
        _args,
        _lib
      ) => {
        const output = _args["_output"]?.__value;
        const edgemap = { value, display, subscribe, argslist, lib };
        const runedge = output && edgemap[output] ? output : "value";

        if(lib) {
          _lib = {..._lib, ...(run_runnable(lib, _lib)?.__value ?? {})}
        }

        let args;
        if (argsfn) {
          args = run_runnable({...argsfn, args: {...argsfn.args, _output: _lib.no.of("value")}}, _lib).__value;
        }

        const runedgeresult = edgemap[runedge]
          ? run_graph(
              edgemap[runedge].graph,
              edgemap[runedge].fn,
              { ...args, ...edgemap[runedge].args, _output: _lib.no.of(runedge === "display" ? "display" : "value") },
              _lib
            )
          : {__value: undefined};

        if (runedge !== "value" && runedgeresult && value) {
          // runedgeresult.__value.value = run_graph(
          //   value.graph,
          //   value.fn,
          //   { ...value.args, ...args, _output: _lib.no.of("value") },
          //   _lib
          // ).__value;
        } else if(runedge === "value" && !value && display) {
          runedgeresult.__value = run_graph(display.graph, display.fn, {...display.args, ...args}, _lib).__value.value;
        }

        if (edgemap.subscribe) {
          const subscriptions = run_graph(
            edgemap.subscribe.graph, 
            edgemap.subscribe.fn,
            { ...args, ...edgemap.subscribe.args},
            _lib
          ).__value

          const graphid = nodysseus_get(subscribe.args, "__graphid").__value;
          const newgraphid = graphid + "/" + _node.id;

          Object.entries(subscriptions)
            .filter(kv => kv[1])
            .forEach(([k, v]) => 
              _lib.no.runtime.add_listener(k, 'subscribe-' + newgraphid, v, false, 
                graphid, true, _lib));
        }

        return runedgeresult;
      },
    },
    compare,
    eq: ({ a, b }) => a === b,
    get: {
      args: ["_graph", "target", "path", "def", "graphval", "_lib"],
      fn: (graph, target, path, def, graph_value, lib) => {
        return nodysseus_get(
          target && target._Proxy ? target._value : target,
          path && path._Proxy ? path._value : graph_value || path,
          lib, 
          def && def._Proxy ? def._value : def
        );
      },
    },
    set: {
      args: ["target", "path", "value", "__graph_value", "_graph_input_value"],
      fn: (target, path, value, nodevalue, _args) => {
        const keys = (nodevalue || path).split(".");
        const check = (o, v, k) =>
          k.length === 1
            ? { ...o, [k[0]]: v }
            : o?.hasOwn?.(k[0])
            ? {
                ...o,
                [k[0]]: check(o[k[0]], v, k.slice(1)),
              }
            : o;
        const ret = (
          ((value !== undefined && ispromise(value)) || ispromise(target)
            ? Promise.all([
                Promise.resolve(value),
                Promise.resolve(target),
              ]).then((vt) => vt[1] !== undefined && check(vt[1], vt[0], keys))
            : check(target, value, keys))
        );
        return ret;
      },
    },
    set_mutable: {
      args: ["target", "path", "value", "_node"],
      fn: (target, path, value, node) => {
        set(target, node.value || path, value);
        return target;
      },
    },
    liftarraypromise: {
      args: ["array"],
      resolve: true,
      fn: (array) => {
        const isarraypromise = array.reduce(
          (acc, v) => acc || ispromise(v),
          false
        );
        return isarraypromise ? Promise.all(array) : array;
      },
    },
    script: {
      args: ["_node", "_node_args", "_graph", "_lib", "_graph_input_value"],
      fn: (node, node_inputs, graph, _lib, _graph_input_value) =>
        node_script(
          node,
          node,
          node_inputs,
          _lib,
          graph,
          _lib.no.runtime.get_edges_in(graph, node.id),
          _graph_input_value
        ),
    },
    new_array: {
      args: ["_node_args", "__graph_value"],
      fn: (args, nodevalue) => {
        if (nodevalue) {
          return nodevalue.split(/,\s+/);
        }
        const argskeys = Object.keys(args);
        const arr =
          args && argskeys.length > 0
            ? argskeys
                .sort()
                .reduce(
                  (acc, k) => [
                    acc[0].concat([args[k]]),
                    acc[1] || ispromise(args[k]),
                  ],
                  [[], false]
                )
            : JSON.parse("[" + node.value + "]");
        return arr[1] ? Promise.all(arr[0]) : arr[0];
      },
    },
    fetch: {
      resolve: true,
      args: ["_node", "url", "params"],
      fn: (node, url, params) => resfetch(url || node.value, params),
    },
    import_module: {
      args: ["url", "__graph_value"],
      fn: (url, graphvalue) => (url || graphvalue) && import(url || graphvalue),
    },
    call: {
      resolve: true,
      args: ["__graph_value", "self", "fn", "args", "_graph_input_value", "_lib"],
      fn: (nodevalue, self, fn, args, _args, lib) => {
        const runfn = (args) => {
          if (typeof self === "function") {
            return Array.isArray(args)
              ? self(
                  ...args
                    .reverse()
                    .reduce(
                      (acc, v) => [
                        !acc[0] && v !== undefined,
                        acc[0] || v !== undefined
                          ? acc[1].concat([v._Proxy ? v._value : v])
                          : acc[1],
                      ],
                      [false, []]
                    )[1]
                    .reverse()
                )
              : self(args === undefined ? [] : args);
          } else {
            const ng_fn = nodysseus_get(self ?? _args, fn || nodevalue, lib);
            const fnargs = Array.isArray(args)
              ? (args || [])
                  .reverse()
                  .reduce(
                    (acc, v) => [
                      !acc[0] && v !== undefined,
                      acc[0] || v !== undefined
                        ? acc[1].concat([v._Proxy ? v._value : v])
                        : acc[1],
                    ],
                    [false, []]
                  )[1]
                  .reverse()
              : args === undefined
              ? []
              : [args];
            return lib.no.of(ispromise(ng_fn)
              ? ng_fn.then((f) => f.apply(fnargs))
              : ng_fn.apply(self, fnargs));
          }
        }

        return ispromise(args) ? args.then(runfn) : runfn(args);
      },
    },
    merge_objects: {
      args: ["_node_args"],
      resolve: false,
      fn: (args) => {
        const keys = Object.keys(args).sort();
        const resolved = {};
        keys.forEach(
          (k) => (resolved[k] = args[k]._Proxy ? args[k]._value : args[k])
        );
        const promise = keys.reduce(
          (acc, k) => acc || ispromise(resolved[k]),
          false
        );
        return promise
          ? Promise.all(keys.map((k) => Promise.resolve(resolved[k]))).then(
              (es) =>
                Object.assign(
                  {},
                  ...es.filter((a) => a && typeof a === "object")
                )
            )
          : Object.assign(
              {},
              ...keys
                .map((k) =>
                  resolved[k] && resolved[k]._Proxy
                    ? resolved[k]._value
                    : resolved[k]
                )
                .filter((a) => a && typeof a === "object")
            );
        // Object.fromEntries(keys
        //     .map(k => args[k]?._Proxy ? args[k]._value : args[k])
        //     .flatMap(o => typeof o === 'object' && o ? Object.entries(o) : [])
        // )
      },
    },
    delete: {
      args: ["target", "path"],
      resolve: false,
      fn: (target, path) => {
        while (target && target._Proxy) {
          target = target._value;
        }
        const newval = Object.assign({}, target);
        delete newval[path];
        return newval;
      },
    },
    add: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) =>
        Object.entries(args)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .reduce((acc, v) => acc + v[1], typeof args[0] === "number" ? 0 : ""),
    },
    and: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true),
    },
    mult: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc * v, 1),
    },
    negate: {
      args: ["value"],
      resolve: true,
      fn: (value) => -value,
    },
    divide: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc / v, 1),
    },
    unwrap_proxy: {
      args: ["proxy"],
      resolve: false,
      fn: (proxy) => ({
        fn: proxy._value._nodeid,
        graph: proxy._value._graphid,
        args: proxy._value._graph_input_value,
      }),
    },
    modify: {
      args: ["target", "path", "fn", "_node", "_lib", "_graph_input_value"],
      resolve: false,
      fn: (target, path, fn, node, _lib, args) => {
        while (target?._Proxy) {
          target = target._value;
        }
        const keys = (node.value || path).split(".");
        const check = (o, fn, k) =>
          k.length === 1
            ? {
                ...o,
                [k[0]]: run(fn._graphid, fn._nodeid, {
                  ...args,
                  value: o[k[0]],
                }),
                _needsresolve: true,
              }
            : o?.hasOwn?.(k[0])
            ? {
                ...o,
                [k[0]]: check(o[k[0]], fn, k.slice(1)),
                _needsresolve: true,
              }
            : o;
        return check(target, fn, keys);
      },
    },
    properties: {
      getOwnEnumerables: function (obj) {
        return this._getPropertyNames(obj, true, false, this._enumerable);
        // Or could use for..in filtered with hasOwnProperty or just this: return Object.keys(obj);
      },
      getOwnNonenumerables: function (obj) {
        return this._getPropertyNames(obj, true, false, this._notEnumerable);
      },
      getOwnEnumerablesAndNonenumerables: function (obj) {
        return this._getPropertyNames(
          obj,
          true,
          false,
          this._enumerableAndNotEnumerable
        );
        // Or just use: return Object.getOwnPropertyNames(obj);
      },
      getPrototypeEnumerables: function (obj) {
        return this._getPropertyNames(obj, false, true, this._enumerable);
      },
      getPrototypeNonenumerables: function (obj) {
        return this._getPropertyNames(obj, false, true, this._notEnumerable);
      },
      getPrototypeEnumerablesAndNonenumerables: function (obj) {
        return this._getPropertyNames(
          obj,
          false,
          true,
          this._enumerableAndNotEnumerable
        );
      },
      getOwnAndPrototypeEnumerables: function (obj) {
        return this._getPropertyNames(obj, true, true, this._enumerable);
        // Or could use unfiltered for..in
      },
      getOwnAndPrototypeNonenumerables: function (obj) {
        return this._getPropertyNames(obj, true, true, this._notEnumerable);
      },
      getOwnAndPrototypeEnumerablesAndNonenumerables: function (
        obj,
        includeArgs
      ) {
        return this._getPropertyNames(
          obj,
          true,
          true,
          this._enumerableAndNotEnumerable,
          includeArgs
        );
      },
      // Private static property checker callbacks
      _enumerable: function (obj, prop) {
        return obj.propertyIsEnumerable(prop);
      },
      _notEnumerable: function (obj, prop) {
        return !obj.propertyIsEnumerable(prop);
      },
      _enumerableAndNotEnumerable: function (obj, prop) {
        return true;
      },
      // Inspired by http://stackoverflow.com/a/8024294/271577
      _getPropertyNames: function getAllPropertyNames(
        obj,
        iterateSelfBool,
        iteratePrototypeBool,
        includePropCb,
        includeArgs
      ) {
        var props = [];

        do {
          if (iterateSelfBool) {
            Object.getOwnPropertyNames(obj).forEach(function (prop) {
              if (props.indexOf(prop) === -1 && includePropCb(obj, prop)) {
                props.push(prop);
              }
            });
          }
          if (!iteratePrototypeBool) {
            break;
          }
          iterateSelfBool = true;
        } while ((obj = Object.getPrototypeOf(obj)));

        return props;
      },
    },
    stringify: {
      args: ["object", "spacer"],
      resolve: true,
      fn: (obj, spacer) =>
        JSON.stringify(
          obj,
          (key, value) => (value?._Proxy ? value._value : value),
          spacer
        ),
    },
    parse: {
      args: ["string"],
      resolve: true,
      fn: (args) => JSON.parse(args),
    },
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

const run = (node, args, lib) => {
  lib.no.runtime.update_graph(node.graph);
  return run_node(node, Object.fromEntries(Object.entries(args ?? {}).map(e => [e[0], lib.no.of(e[1])])), node.args, lib)?.__value
}

export { nolib, run, objToGraph, bfs, calculateLevels, compare, hashcode, add_default_nodes_and_edges, ispromise, NodysseusError, base_graph, base_node, resfetch };
