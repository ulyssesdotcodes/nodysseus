import set from "just-safe-set";
import loki from "lokijs";
import { ancestor_graph, ispromise, isWrappedPromise, mapMaybePromise, node_args, WrappedPromise, wrapPromise, wrapPromiseAll } from "./util"
import { isNodeGraph, Graph, LokiT, Node, NodysseusStore, Store, Result, Runnable, isValue, isNodeRef, RefNode, Edge, isFunctorRunnable, isApRunnable, ApRunnable, FunctorRunnable, isConstRunnable, ConstRunnable, isRunnable, isNodeScript, InputRunnable, isInputRunnable, Lib, Env, isEnv, isLib } from "./types"
import { combineEnv,  newLib, newEnv, mergeEnv, mergeLib, } from "./util"
import generic from "./generic.js";
import { create_fn, expect, now } from "./externs";

const Nodysseus = (): NodysseusStore => {
  const isBrowser = typeof window !== 'undefined';
  const persistdb = new loki("nodysseus_persist.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  })
  const refsdb = persistdb.addCollection<LokiT<Node>>("refs", {unique: ["id"]});

  const db = new loki("nodysseus.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  });


  const graphsdb = db.addCollection<LokiT<Graph>>("nodes", { unique: ["id"] });
  const statedb = db.addCollection<LokiT<any>>("state", { unique: ["id"] });
  const fnsdb = db.addCollection<LokiT<{script: string, fn: Function}>>("fns", { unique: ["id"] });
  const parentsdb = db.addCollection<LokiT<{parent: string, parentest: string}>>("parents", { unique: ["id"] });

  return {
    refs: {
      ...lokidbToStore(refsdb), 
      add_node: () => {}, 
      remove_edge: () => {},
      add_edge: () => {},
      remove_node: () => {},
    },
    parents: lokidbToStore(parentsdb),
    graphs: lokidbToStore(graphsdb),
    state: lokidbToStore(statedb),
    fns: lokidbToStore(fnsdb),
    assets: {
      get: id => { throw new Error("not implemented")},
      add: (id, value) => { throw new Error("not implemented")},
      remove: id => { throw new Error("not implemented")},
      removeAll: () => { throw new Error("not implemented")},
      all: () => {  throw new Error("not implemented")},
      addMany: bs => { throw new Error("not implemented")}
    }
  }
}

export const lokidbToStore = <T>(collection: loki.Collection<LokiT<T>>) => ({
  add: (id: string, data: T) => {
    const existing = collection.by("id", id);
    if (existing) {
      collection.update(Object.assign(existing, {data}));
    } else {
      collection.insert({ id,  data});
    }
  },
  get: (id: string) => collection.by("id", id)?.data,
  remove: (id: string) => {
    const existing = collection.by("id", id)
    if(existing){
      collection.remove(existing);
    }
  },
  removeAll: () => collection.clear(),
  all: () => collection.where(_ => true).map(v => v.data),
  addMany: gs => gs.map(([id, data]) => collection.insert({id, data}))
})

let nodysseus: NodysseusStore;

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

export const nodysseus_get = (obj: Record<string, any>, propsArg: string, lib: Lib, defaultValue=undefined) => {
    let objArg = obj;
    obj = isEnv(obj) ? obj.data : obj
    let level = 0;
  if (!obj) {
    return defaultValue;
  }
  const naive = obj[propsArg];
  if(naive) {
    return naive;
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
    if(obj && isRunnable(obj)) {
        const ran = run_runnable(obj, lib)
        if(ispromise(ran)) {
          obj = ran;
          continue
        } else if (isValue(ran)) {
          obj = ran.value;
          continue;
        }
    }

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, props.join('.'), lib, defaultValue) : r)
    }

    prop = props.length == 0 ? props[0] : props.shift();
    if(propsArg === "extern.return" && !obj[prop]) {
      debugger;
    }
    if((obj === undefined || typeof obj !== 'object' || (obj[prop] === undefined && !(obj.hasOwnProperty && obj.hasOwnProperty(prop))))){
        return isEnv(objArg) ? nodysseus_get(objArg.env, propsArg, lib, defaultValue) : defaultValue;
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
        if(key === "__args"){
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
  node_id: string;
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

const node_nodes = (node, node_id, data, graph_input_value: Env, lib: Lib) => {
    return run_graph(node, node_id, combineEnv(data, graph_input_value, "nodenodes" + node_id, graph_input_value._output), lib)
}

const node_script = (node, nodeArgs: Record<string, ConstRunnable>, lib: Lib): Result | Promise<Result> => {
    let orderedargs = "";
    const data = {};
    for(let i of Object.keys(nodeArgs)) {
        orderedargs += ", " + i;
        if(nodeArgs[i] !== undefined){
            const graphval = wrapPromise(run_runnable(nodeArgs[i], lib)).then(gv => gv?.value);
            data[i] = graphval;
        }
    }

    const name = node.name ? node.name.replace(/\W/g, "_") : node.id;
    const fn = lib.data.no.runtime.get_fn(node.id, name, `_lib, _node, _graph_input_value${orderedargs}`, node.script ?? node.value);

    return wrapPromiseAll(Object.values(data))
      .then(promisedData => lib.data.no.of(fn.apply(null, [lib.data, node, data, ...promisedData]))).value
}

const node_extern = (node: RefNode, data: Record<string, ConstRunnable>, graphArgs: Env, lib: Lib) => {
    const extern = nodysseus_get(lib.data, node.value, lib);
    let argspromise = false;
    const args = typeof extern === 'function' ?  resolve_args(data, lib) :  extern.args.map(arg => {
        let newval;
        if (arg === '_node') {
            newval = node 
        } else if (arg === '_node_args') {
          newval = extern.rawArgs ? data : resolve_args(data, lib)
          newval = ispromise(newval) ? newval.then((v: Result | undefined) => v?.value)  : extern.rawArgs ? newval : newval.value
        } else if (arg == '_lib') {
            newval = lib;
        } else if (arg == '_graph_input_value') {
            newval = graphArgs;
        } else if (arg == '__graphid') {
            newval = nodysseus_get(graphArgs, "__graphid", lib);
        } else {
            newval = extern.rawArgs ? data[arg] : run_runnable(data[arg], lib, {})
            newval = ispromise(newval) ? newval.then((v: Result) => v?.value) : newval && !extern.rawArgs ? newval.value : newval;
        }

        argspromise ||= ispromise(newval);
        return newval;
    });

    argspromise ||= ispromise(args)

    if (argspromise) {
        return (Array.isArray(args) ? Promise.all(args) : args.then(v => v?.value.args)).then(as => {
            const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, as);
            return mapMaybePromise(res, res => extern.rawArgs ? res : lib.data.no.of(res));
        })
    } else {
        const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, Array.isArray(args) ? args : args?.value.args);
        return mapMaybePromise(res, res => extern.rawArgs ? res : lib.data.no.of(res));
    }
}

const resolve_args = (data: Record<string, ConstRunnable>, lib: Lib): Result | Promise<Result> => {
    let is_promise = false;
    const result = {}
    Object.entries(data).forEach(kv => {
      result[kv[0]] = run_runnable(kv[1], lib);
      is_promise = is_promise || !!kv[1] && ispromise(result[kv[0]]);
    })

    if (is_promise) {
        const promises = [];
        Object.entries(result).forEach(kv => {
            promises.push(Promise.resolve(kv[1]).then(pv => [kv[0], (pv as Result)?.value]))
        })
        return Promise.all(promises).then(Object.fromEntries).then(v => lib.data.no.of(v));
    }

    return lib.data.no.of(Object.fromEntries(
        Object.entries(result)
            .filter(d => !d[0].startsWith("__")) // filter out private variables
            .map(e => [e[0], (e[1] as Result)?.value])
    ));

}

const node_data = (nodeArgs, graphArgs, lib) => {
  return Object.keys(nodeArgs).length === 0 ? lib.data.no.of(undefined) : resolve_args(nodeArgs, lib);
}

const createFunctorRunnable = (fn: Exclude<Runnable, Result | ApRunnable>, args: ConstRunnable, lib): FunctorRunnable | Promise<FunctorRunnable> => {
  const argsval = args && run_runnable(args, lib)
  const ret = fn && mapMaybePromise(argsval, args => lib.data.no.of({
    __kind: "functor",
    fnargs: args ? [...new Set(args.value ? Object.keys(args.value).map(k => k.includes(".") ? k.substring(0, k.indexOf('.')) : k) : [])] : [],
    env: fn.env,
    graph: fn.graph,
    fn: fn.fn,
    lib
  }))
  return ret;
}

const run_runnable = (runnable: Runnable, lib: Lib, args: Record<string, any> = {}): Result | Promise<Result> => 
    isConstRunnable(runnable)
    ? run_graph(runnable.graph, runnable.fn, mergeEnv(args, runnable.env), runnable.lib)
    : isApRunnable(runnable)
    ? run_ap_runnable(runnable, args, lib)
    : isFunctorRunnable(runnable)
    ? run_functor_runnable(runnable, args, lib)
    : runnable


// graph, node, symtable, parent symtable, lib
const run_node = (node: Node | Runnable, nodeArgs: Record<string, ConstRunnable>, graphArgs: Env, lib: Lib): Result | Promise<Result> => {
    if (isRunnable(node)){
      if(isValue(node)) {
        return node
      } else if (isApRunnable(node)) {
        throw new Error("Unexpected node")
      } else {
        const graphid = nodysseus_get(graphArgs, "__graphid", lib)?.value;
        const nodegraphargs: Env = node.env ?? newEnv({}, graphArgs._output)
        nodegraphargs.data.__graphid = graphid ?? lib.data.no.of(node.graph.id);
        lib = mergeLib(node.lib, lib)

        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib)
      }
    } else if(isNodeRef(node)) {
        if (node.ref === "arg") {
            const resval = nolib.no.arg(node, graphArgs, lib, node.value);
            // return resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval);
            return wrapPromise(resval).then(resval => resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval)).value;
        } else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib)
        } else if (node.ref === "script") {
            return node_script(node, nodeArgs, lib)
        }

        let node_ref = lib.data.no.runtime.get_ref(node.ref);

        if (!node_ref) {
            throw new Error(`Unable to find ref ${node.ref} for node ${node.name || node.id}`)
        }

        const graphid = nodysseus_get(graphArgs, "__graphid", lib).value;
        const newgraphid = (graphid + "/") + node.id
        const newGraphArgs = newEnv({__graphid: lib.data.no.of(newgraphid)}, graphArgs._output);
        if(node_ref.nodes) {
            const current = lib.data.no.runtime.get_graph(newgraphid);
            lib.data.no.runtime.set_parent(newgraphid, graphid); // before so that change/update has the parent id
            if(current.refid && current?.refid !== node_ref.id){
              lib.data.no.runtime.change_graph({...node_ref, id: newgraphid, refid: node_ref.id}, lib, false)
            } else {
              lib.data.no.runtime.update_graph(newgraphid)
            }
        }

        return run_node(node_ref, node.value ? {...nodeArgs, __graph_value: lib.data.no.of(node.value)} : nodeArgs, newGraphArgs, lib)
    } else if (isNodeGraph(node)) {
        return node_nodes(node, node.out ?? "out", nodeArgs, graphArgs, lib)
    } else if (isNodeScript(node)){
        return node_script(node, nodeArgs, lib)
    } else if(Object.hasOwn(node, "value")) {
        return lib.data.no.of(node_value(node));
    } else {
        return node_data(nodeArgs, graphArgs, lib)
    }
}

// derives data from the args symbolic table
const create_data = (node_id, graph, graphArgs: Env, lib: Lib): Record<string, ConstRunnable> => {
    const inputs = lib.data.no.runtime.get_edges_in(graph, node_id);
    const data: Record<string, ConstRunnable> = {};
    let input: Edge;
    //TODO: remove
    const newgraphargs = graphArgs._output ? mergeEnv({_output: undefined}, graphArgs) : graphArgs;
    // delete newgraphargs._output

    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];

        const val: ConstRunnable = {__kind: "const", graph, fn: input.from, env: newgraphargs, lib}
        // Check for duplicates
        if(data[input.as]) {
            const as_set = new Set()
            inputs.forEach(e => {
                if (as_set.has(e.as)) {
                    throw new NodysseusError(nodysseus_get(graphArgs, "__graphid", lib).value + "/" + node_id, `Multiple input edges have the same label "${e.as}"`)
                }
                as_set.add(e.as)
            })
        }
        data[input.as] = val;
    }

    return data;
}

// handles graph things like edges
const run_graph = (graph: Graph | (Graph & {nodes: Array<Node>, edges: Array<Edge>}), node_id: string, env: Env, lib: Lib): Result | Promise<Result> => {
  const handleError = e => {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        if(e instanceof NodysseusError) {
            lib.data.no.runtime.publish("grapherror", e)
            return;
        }
        const parentest = lib.data.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        lib.data.no.runtime.publish("grapherror", new NodysseusError(
            nodysseus_get(env, "__graphid", lib)?.value + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))

        return e;
  }
  // TODO: remove old graph notation
    const newgraph = Array.isArray(graph.nodes) && Array.isArray(graph.edges) ? {...graph, nodes: Object.fromEntries(graph.nodes.map(n => [n.id, n])), edges: Object.fromEntries(graph.edges.map(e => [e.from, e]))} : graph;
    const node = lib.data.no.runtime.get_node(newgraph, node_id);

    try {
        lib.data.no.runtime.publish('noderun', {graph: newgraph, node_id})

        const data = create_data(node_id, newgraph, env, lib);
        const res = run_node(node, data, env, lib);
        return ispromise(res) ? res.catch(handleError) : res
    } catch (e) {
      return handleError(e)
    }
}

const run_functor_runnable = (runnable: FunctorRunnable, args: Record<string, unknown>, lib: Lib): Result | Promise<Result> => {
  const execArgs = Object.fromEntries(runnable.fnargs?.map(k => [k, nodysseus_get(args, k, lib, runnable.fnargs[k])]) ?? []);
  const newRunnable: ConstRunnable = {
    __kind: "const",
    env: combineEnv(execArgs ?? {}, runnable.env, "functor runnable" + runnable.fn),
    fn: runnable.fn,
    graph: runnable.graph,
    lib
  }
  return run_runnable(newRunnable, lib)
}

const run_ap_runnable = (runnable: ApRunnable, args: Record<string, any>, lib: Lib): Result | Promise<Result> => {
  const computedArgs = run_runnable(runnable.args, lib, args);
  const execute = (execArgs): WrappedPromise<any> => {
    const ret = (Array.isArray(runnable.fn) ? runnable.fn : [runnable.fn])
    .map(rfn => run_runnable(
      rfn,
      lib,
      execArgs ? Object.fromEntries(Object.entries(execArgs.value).map(kv => [kv[0], lib.data.no.of(kv[1])])) : {}, 
    ))
    return Array.isArray(runnable.fn) ? wrapPromiseAll(ret.map(wrapPromise)) : wrapPromise(ret[0]);
  }
  return wrapPromise(computedArgs).then(execute).then(v => v.value).value;
}


const getmap = (map, id) => {
    return id ? map.get(id) : id;
}
const getorset = (map, id, value_fn=undefined) => {
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

const base_node = node => node.ref || node.extern ? ({id: node.id, value: node.value, name: node.name, ref: node.ref}) : base_graph(node);
const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, out: graph.out})

export const run = (node: Runnable | InputRunnable, args: Record<string, any> = {}, lib: Lib | undefined = undefined, store: NodysseusStore = nodysseus) => {
  initStore(store);

  let _lib: Lib = mergeLib(lib, newLib(nolib))
  if(isRunnable(node) && isValue(node)) {
    return node.value;
  }

  isRunnable(node) && isFunctorRunnable(node) && !_lib.data.no.runtime.get_ref(node.graph.id) && _lib.data.no.runtime.change_graph(node.graph)
  isRunnable(node) && isFunctorRunnable(node) && _lib.data.no.runtime.update_graph(node.graph, _lib);

  const res = run_runnable(
    isRunnable(node) 
      ? {...node, lib: node.lib && isLib(node.lib) ? mergeLib(node.lib, _lib) :  _lib}
      : {...node, __kind: "const", env: node.env ?? newEnv({__graphid: _lib.data.no.of(node.graph.id)}), lib: _lib
        // mergeEnv(
        //   Object.fromEntries(Object.entries(args ?? {}).map(e => [e[0], _lib.data.no.of(e[1])])), 
        //   node.env ?? newEnv({__graphid: _lib.data.no.of(node.graph.id)})
        // )
      }, 
    _lib, args);
  return ispromise(res) ? res.then(r => r?.value) : res?.value
}

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if(store) {
    nodysseus = store;
  } else if(!nodysseus) {
    nodysseus = Nodysseus();
  }

  if(!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn()
  }
}

const nolib = {
  no: {
    of: <T>(value): Result | Promise<Runnable> => ispromise(value) ? value.then(nolib.no.of) : isValue(value) ? value : { __kind: "result", value: value},
    arg: (node, target: Env, lib: Lib, value) => {
      let valuetype, nodevalue;
      if(value.includes(": ")) {
        const typedvalue = value.split(": ");
        nodevalue = typedvalue[0];
        valuetype = typedvalue[1];
      } else {
        nodevalue = value;
      }
      const newtarget = () => {
        const newt = Object.assign({}, target.data);
        Object.keys(newt).forEach(k => k.startsWith("_") && delete newt[k])
        return newt;
      };

      const parenttarget = () => {
        const newt = Object.assign({}, target.env.data);
        Object.keys(newt).forEach(k => k.startsWith("_") && delete newt[k])
        return newt;
      };

      const ret = nodevalue === undefined || target === undefined
        ? undefined
        : nodevalue === "_node"
        ? node
        : nodevalue.startsWith("_node.")
        ? nodysseus_get(node, nodevalue.substring("_node.".length), lib)
        : nodevalue.startsWith("_lib.")
        ? nodysseus_get(lib.data, nodevalue.substring("_lib.".length), lib)
        : nodevalue === "_args"
        ? newtarget()
        : nodevalue === "__args"
        ? parenttarget()
          // lib.data.no.of(Object.fromEntries(Object.entries(parenttarget()).map(([key, value]: [string, any]) => [key, value?.isArg && valuetype !== "raw" ? run_runnable(value, lib)?.value : value])))
        : nodysseus_get(
            node.type === "local" || node.type?.includes?.("local")
              ? newtarget()
              : node.type === "parent" || node.type?.includes?.("parent")
              ? target.env
              : target,
            nodevalue,
            lib
          );

      // let retrun = run_runnable(ret, lib);
      // while(retrun?.isArg && valuetype !== "raw") {
      //   retrun = run_runnable(ret, lib)
      // }

      const retrun = isConstRunnable(ret) && valuetype !== "raw" ? run_runnable(ret, lib) : undefined;
      const r = ispromise(retrun) ? retrun.then(v => v?.value) : retrun ? isValue(retrun) || isWrappedPromise(retrun) ? retrun?.value : retrun : ret;
      return r
    },
    base_graph,
    base_node,
    NodysseusError,
    runtime: undefined,
    runtimefn: (function () {

      const polyfillRequestAnimationFrame = typeof window !== "undefined" ? window.requestAnimationFrame : (fn => setTimeout(fn, 16))

      const event_listeners = new Map();
      const event_listeners_by_graph = new Map();
      const event_data = new Map(); // TODO: get rid of this
      const getorsetgraph = (graph, id) => nodysseus.graphs.get(id) ?? (nodysseus.graphs.add(id, graph), graph)
      let animationframe;
      let animationerrors = [];
      const publish = (event, data, lib: Lib) => {
        const runpublish = (data) => {
          event_data.set(event, data);

          const listeners = getorset(event_listeners, event, () => new Map());
          for (let l of listeners.values()) {
            if (typeof l === "function") {
              l(data);
            } else if (typeof l === "object" && l.fn && l.graph) {
              run_graph(
                l.graph,
                l.fn,
                Object.assign({}, l.args || {}, { data }),
                mergeLib(l.lib, lib)
              );
            }
          }

          if (
            event === "animationframe" &&
            listeners.size > 0 && // the 1 is for the animationerrors stuff below
            !animationframe &&
            animationerrors.length == 0
          ) {
            animationframe = polyfillRequestAnimationFrame(() => {
              animationframe = false;
              publish("animationframe", {}, lib);
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
        remove = false,
        graph_id = false,
        prevent_initial_trigger = false,
        lib: Lib = {__kind: "lib", data: nolib}
      ) => {
        const listeners = getorset(event_listeners, event, () => new Map());
        const fn =
          typeof input_fn === "function"
            ? input_fn
            : (args) => {
                run_runnable(input_fn, mergeLib(input_fn.lib, lib), args);
              };
        if (!listeners.has(listener_id)) {
          if (!prevent_initial_trigger) {
            polyfillRequestAnimationFrame(() => {
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
          polyfillRequestAnimationFrame(() => publish(event, {}, lib));
        }

      };

      // Adding a listener to listen for errors during animationframe. If there are errors, don't keep running.
      add_listener('grapherror', "__animationerrors", e => animationerrors.push(e));
      add_listener('graphchange', "__animationerrors", e => animationerrors.splice(0, animationerrors.length));

      const remove_listener = (event, listener_id) => {
        if (event === "*") {
          [...event_listeners.values()].forEach((e) => e.delete(listener_id));
        } else {
          const listeners = getorset(event_listeners, event, () => new Map());
          listeners.delete(listener_id);
        }
      };

      const remove_graph_listeners = (graph_id) => {
        const graph_listeners = event_listeners_by_graph.get(graph_id);
        if (graph_listeners) {
          for (const evt of graph_listeners.entries()) {
            getorset(event_listeners, evt[0])?.delete(evt[1]);
          }
        }
      };

      const change_graph = (graph: Graph, lib: Lib, addToStore = true) => {
        const old_graph = nodysseus.graphs.get(graph.id);
        nodysseus.graphs.add(graph.id, graph)

        // if (old_graph) {
        //   for (const n of Object.keys(old_graph.nodes)) {
        //     if (graph[n] !== n) {
        //       const nodegraphid = graph.id + "/" + n;
        //       nodysseus.graphs.remove(graph.id + "/" + n)
        //     }
        //   }
        // }

        const parent = get_parentest(graph);
        if (parent) {
          lib.data.no.runtime.update_graph(parent, lib);
        } else {
          if(addToStore) {
            nodysseus.refs.add(graph.id, graph)
          }
          publish("graphchange", graph, lib);
          publish("graphupdate", graph, lib);
        }
      };

      const update_args = (graph, args, lib: Lib) => {
        const graphid = typeof graph === "string" ? graph : graph.id;
        let prevargs = nodysseus.state.get(graphid);

        if (prevargs === undefined) {
          prevargs = {};
          nodysseus.state.add(graphid, prevargs);
        }

        if (!compare(prevargs, args)) {
          Object.assign(prevargs, args);
          const fullgraph = get_graph(graphid);
          publish("graphupdate", get_parentest(fullgraph) ?? fullgraph, lib);
        }
      };

      const get_ref = id => nodysseus.refs.get(id) ?? generic.nodes[id]
      const add_ref = (graph: Node) => {
        if(!generic.nodes[graph.id]) {
          nodysseus.refs.add(graph.id, graph)
        }
      }
      const remove_ref = nodysseus.refs.remove

      const get_node = (graph: Graph, id: string) => get_graph(graph)?.nodes[id]
      const get_edge = (graph, from) => get_graph(graph)?.edges[from]
      const get_edges_in = (graph, id) =>
        Object.values(get_graph(graph).edges).filter((e: Edge) => e.to === id)
      const get_edge_out = get_edge
      const get_args = (graph) => nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {};
      const get_graph = (graph: string | Graph): Graph => nodysseus.refs.get(typeof graph === "string" ? graph : graph.id) as Graph ?? graph as Graph
      const get_parent = (graph) => {
        const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return parent ? get_graph(parent.parent) : undefined;
      };
      const get_parentest = (graph) => {
       const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return parent && parent.parentest && get_graph(parent.parentest);
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

      nodysseus.refs.addMany(Object.values((generic as Graph).nodes).map(n => [n.id, n]));

      if(nodysseus.refs.startListening) {
        nodysseus.refs.startListening()
      }

      return {
        run: run,
        get_ref,
        add_ref,
        add_refs: (gs) => nodysseus.refs.addMany(gs.map(g => [g.id, g])),
        remove_ref,
        // get_asset,
        // add_asset,
        // remove_asset,
        get_node,
        get_edge,
        get_edges_in,
        get_edge_out,
        get_parent,
        get_parentest,
        get_fn: (id, name, orderedargs, script): Function => {
          const fnid = id;
          let fn = nodysseus.fns.get(fnid + orderedargs);
          if (!fn || fn.script !== script) {
            const update = !!fn;

            fn = Object.assign(fn ?? {}, {
              script,
              fn: new Function( `return function _${name.replace(
                  /(\s|\/)/g,
                  "_"
                )}(${orderedargs}){${script}}`
              )(),
              // ` this comment is here because my syntax highlighter is not well
            });

            nodysseus.fns.add(fnid + orderedargs, fn)
          }

          return fn.fn;
        },
        change_graph,
        update_graph: (graphid, lib: Lib) => publish('graphupdate', {graphid}, lib),
        update_args,
        get_graph,
        get_args,
        get_path,
        refs: () => nodysseus.refs.all(),
        ref_graphs: () => nodysseus.refs.all(),
        update_edges: (graph: string | Graph, add: Array<Edge>, remove: Array<Edge> = [], lib: Lib, dryRun = false): void => {
          const graphId = typeof graph === "string" ? graph : graph.id;
          if(Array.isArray(remove)) {
            remove.map(e => nodysseus.refs.remove_edge(graphId, e))
          } else if (typeof remove === "object") {
            nodysseus.refs.remove_edge(graphId, remove)
          }
          if(Array.isArray(add)) {
            add.map(e => nodysseus.refs.add_edge(graphId, e))
          } else if (typeof add === "object") {
            nodysseus.refs.add_edge(graphId, add)
          }
          change_graph(nodysseus.refs.get(graphId) as Graph, lib);
        },
        add_node: (graph: Graph, node: Node, lib: Lib) => {
          if (!(node && typeof node === "object" && node.id)) {
            throw new Error(`Invalid node: ${JSON.stringify(node)}`);
          }

          // graph = get_graph(graph);

          // const new_graph = {
          //   ...graph,
          //   nodes: {...graph.nodes, [node.id]: node},
          // };

          // n.b. commented out because it blasts update_args which is not desirable
          // delete_cache(graph)
          const graphId = typeof graph === "string" ? graph : graph.id;
          nodysseus.refs.add_node(graphId, node)
          change_graph(nodysseus.refs.get(graphId) as Graph, lib);
        },
        delete_node: (graph: Graph, id, lib: Lib, changeEdges=true) => {
          graph = get_graph(graph);
          const graphId = typeof graph === "string" ? graph : graph.id;

          const parent_edge = graph.edges[id]
          const child_edges = Object.values(graph.edges).filter((e) => e.to === id);

          const current_child_edges = Object.values(graph.edges).filter(
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

          const newnodes = {...graph.nodes}
          delete newnodes[id]

          nodysseus.refs.remove_node(graphId, id)
          if(changeEdges) {
            child_edges.map(e => nodysseus.refs.remove_edge(graphId, e))
            nodysseus.refs.remove_edge(graphId, parent_edge)
            new_child_edges.map(e => nodysseus.refs.add_edge(graphId, e))
            change_graph(nodysseus.refs.get(graphId) as Graph, lib);
          }


          // const new_graph = {
          //   ...graph,
          //   nodes: newnodes,
          //   eages: Object.fromEntries(Object.entries(graph.edges)
          //     .filter((e) => e[1] !== parent_edge && e[1].to !== id)
          //     .concat(new_child_edges.map(e => [e.from, e]))),
          // };

          // change_graph(new_graph, lib);
        },
        add_listener,
        add_listener_extern: {
          args: ["event", "listener_id", "fn"],
          add_listener,
        },
        remove_listener,
        remove_graph_listeners,
        publish: (event, data, lib: Lib) => publish(event, data, lib),
        set_parent: (graph, parent) => {
          const graphid = graph;
          const parentid = parent;
          const parent_parent = nodysseus.parents.get(parentid);
          const parentest =
            (parent_parent ? parent_parent.parentest : false) || parentid;
          const new_parent = {
            id: graphid,
            parent: parentid,
            parentest,
          };
          nodysseus.parents.add(graphid, new_parent)
        },
      };
    }),
  },
  extern: {
    // runGraph: F<A> => A
    ap: {
      rawArgs: true,
      args: ["fn", "args", "run", "_lib"],
      fn: (fn, args, run, lib: Lib) => {
        const fnResult = wrapPromise(run_runnable(fn, lib));

        const resolveRunnable = (runnable) => isRunnable(runnable) && isConstRunnable(runnable) ? 
          wrapPromise(run_runnable(runnable, lib))
            .then(r => resolveRunnable(r.value)) : wrapPromise(runnable)

        const apRunnable = (fnRunnable: FunctorRunnable | Array<FunctorRunnable>): ApRunnable => ({
            __kind: "ap",
            fn: Array.isArray(fnRunnable) ? fnRunnable.filter(v => v) : fnRunnable,
            args,
            lib
          })
        return fnResult
          .then(fnr => Array.isArray(fnr.value) ? fnr.value.map(fnrv => resolveRunnable(fnrv).value) :  resolveRunnable(fnr.value).value)
          .then(fnr => apRunnable(fnr))
          .then(apfn => run ? run_runnable(apfn, lib) : apfn)
          .then(res => lib.data.no.of(res)).value
      }
    },
    create_fn: {
      args: ["runnable", "_lib"],
      fn: create_fn
    },
    switch: {
      rawArgs: true,
      args: ["input", "_node_args", "_lib"],
      fn: (input, args, lib: Lib) => {
        const inputval = run_runnable(input, lib);
        return ispromise(inputval) 
          ? inputval.then(ival => run_runnable(args[ival?.value], lib)) 
          : run_runnable(args[inputval?.value], lib);
      },
    },
    resolve: {
        rawArgs: false,
        args: ['object', '_lib'],
        fn: (object: Record<string, Runnable>, lib) => {
            return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]));
        }
    },
    fold: {
      rawArgs: true,
      args: ["fn", "object", "initial", "_lib"],
      fn: (fn, object, initial, lib: Lib) =>
        wrapPromise(run_runnable(object, lib))
          .then(ov => ov.value)
          .then(objectvalue => 
            objectvalue === undefined ? undefined 
            : wrapPromise(run_runnable(fn, lib))
                .then(fnr => fnr.value)
                .then(fnrunnable =>
                  wrapPromise(run_runnable(initial, lib))
                    .then(initial => initial.value)
                    .then(initial => {
                      const mapobjarr = (mapobj, mapfn, mapinit) =>
                        Array.isArray(mapobj)
                          ? mapobj.reduce(mapfn, mapinit)
                          : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit);

                      initial = initial ?? (Array.isArray(objectvalue) ? [] : {});

                      let errored = false;
                      const errorlistener = (error) => errored = true;

                      // TODO: rethink. Too costly for now
                      // lib.data.no.runtime.add_listener('grapherror', fnrunnable.graph.id, errorlistener)

                      const ret = mapobjarr(
                        objectvalue,
                        (previousValue, currentValue) =>
                          !errored && wrapPromise(previousValue).then(prevVal => run_runnable(fnrunnable, lib,
                            {previousValue: lib.data.no.of(prevVal), currentValue: lib.data.no.of(currentValue)},
                          )).then(rv => rv.value).value,
                        initial
                      );

                      // lib.data.no.runtime.remove_listener('grapherror', fnrunnable.graph.id, errorlistener)

                      return lib.data.no.of(ret);
                    })))
          .value,
    },
    _sequence: {
      args: ["_node_args", "_lib", "__graphid"],
      fn: (_args, lib: Lib, graphid) => {
        // const fns = run_runnable({..._args, args: {graphid: graphid, ..._args.args}}, lib)
        // return nolib.extern.ap.fn(lib.data.no.of(Object.entries(fns).filter(kv => !kv[0].startsWith("_")).map(kv => kv[1])), undefined, false, lib, {})
        return lib.data.extern.ap.fn(lib.data.no.of(Object.values(_args)), undefined, lib.data.no.of(false), lib);
      }
    },
    runnable: {
      rawArgs: true,
      args: ["fn", "args", "_lib"],
      fn: createFunctorRunnable
    },
    expect: {
      args: ["a", "b", "__graph_value"],
      fn: expect
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
        _lib: Lib
      ) => {
        const output = _args._output;
        const edgemap = { value, display, subscribe, argslist, lib };
        const runedge = output && output === display ? display : edgemap[output] ? output : "value";

        const return_result = (_lib: Lib, args) => {
          const runnable = edgemap[runedge] ? {...edgemap[runedge]} : runedge === "value" && !value && display ? display : _lib.data.no.of(undefined);
          if(isRunnable(runnable) && !isValue(runnable) && !isApRunnable(runnable)) {
            runnable.env = combineEnv(runnable.env.data, newEnv(args, _lib.data.no.of(runedge === "display" ? "display" : "value"), runnable.env))
          }

          if(lib) {
            runnable.lib = _lib;
          }

          const runedgeresult = run_runnable(runnable, _lib)
            // edgemap[runedge]
            // ? run_runnable(edgemap[runedge], _lib, Object.assign(
            //   { _output: _lib.data.no.of(runedge === "display" ? "display" : "value") },
            // ))
            // : runedge === "value" && !value && display
            // ? run_runnable(display, _lib, args)
            // : _lib.data.no.of(undefined)

          if (edgemap.subscribe) {
            const graphid = nodysseus_get(subscribe.env, "__graphid", _lib).value;
            const newgraphid = graphid + "/" + _node.id;

            wrapPromise(run_runnable(
              edgemap.subscribe,
              _lib,
              args,
            )).then(subscriptions => subscriptions.value)
            .then(subscriptions =>
              Object.entries(subscriptions)
                .filter(kv => kv[1])
                .forEach(([k, v]) => 
                  _lib.data.no.runtime.add_listener(k, 'subscribe-' + newgraphid, v, false, 
                    graphid, true, _lib)))
          }

          return runedgeresult;
        }

        const ret = wrapPromise(run_runnable(lib, _lib))
            .then(lib => lib?.value)
            .then(lib => wrapPromise(argsfn ? run_runnable({
                ...argsfn,
                lib: mergeLib(lib, _lib)
              }, _lib) : undefined)
              .then(args => return_result(mergeLib(lib, _lib), args?.value))).value
        return ret;
      },
    },
    compare,
    eq: ({ a, b }) => a === b,
    get: {
      args: ["_graph", "target", "path", "def", "graphval", "_lib"],
      fn: (graph, target, path, def, graph_value, lib: Lib) => {
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
      args: ["target", "path", "value", "__graph_value"],
      fn: (target, path, value, nodevalue) => {
        set(target, nodevalue || path, value);
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
          node_inputs,
          _lib,
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
                .filter(k => !k.startsWith("__"))
                .sort()
                .reduce(
                  (acc, k) => [
                    acc[0].concat([args[k]]),
                    acc[1] || ispromise(args[k]),
                  ] as [Array<any>, boolean],
                  [[], false] as [Array<any>, boolean]
                )
            : JSON.parse("[" + nodevalue + "]");
        return arr[1] ? Promise.all(arr[0]) : arr[0];
      },
    },
    fetch: {
      resolve: true,
      args: ["__graph_value", "url", "params"],
      fn: (nodevalue, url, params) => resfetch(url || nodevalue, params),
    },
    import_module: {
      args: ["url", "__graph_value"],
      fn: (url, graphvalue) => (url || graphvalue) && import(url || graphvalue),
    },
    call: {
      resolve: true,
      args: ["__graph_value", "self", "fn", "args", "_graph_input_value", "_lib"],
      fn: (nodevalue, self, fn, args, _args, lib: Lib) => {
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
            const ret = lib.data.no.of(ispromise(ng_fn)
              ? ng_fn.then((f: any) => f.apply(fnargs))
              : ng_fn.apply(self, fnargs));
              return ret;
          }
        }

        return ispromise(args) ? args.then(runfn) : runfn(args);
      },
    },
    merge_objects_mutable: {
      args: ["target", "_node_args"],
      fn: (target, args) => {
        const keys = Object.keys(args).filter(k => k !== "target").sort();
        const resolved = {};
        keys.forEach(
          (k) => (resolved[k] = args[k]?.value ? args[k].value : args[k])
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
              target,
              ...keys
                .map((k) =>
                  resolved[k] && resolved[k]?.value
                    ? resolved[k].value
                    : resolved[k]
                )
                .filter((a) => a && typeof a === "object")
            );
      }
    },
    merge_objects: {
      args: ["_node_args"],
      resolve: false,
      fn: (args) => nolib.extern.merge_objects_mutable.fn({}, args),
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
    now: {
      args: ["scale"],
      fn: now
    },
    math: {
      args: ["__graph_value", "_node_args"],
      resolve: true,
      fn: (graph_value, args) => Math[graph_value](...Object.entries(args).sort((a, b) => a[0].localeCompare(b[0])).map(kv => kv[1]))
    },
    add: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) =>
        Object.entries(args)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(kv => kv[1])
          .reduce((acc, v) => (acc as any) + (v as any)),
    },
    and: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true),
    },
    mult: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc: any, v: any) => acc * v, 1),
    },
    negate: {
      args: ["value"],
      resolve: true,
      fn: (value) => -value,
    },
    divide: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc: any, v: any) => acc / v, 1),
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
                [k[0]]: run_graph(fn.graph, fn.fn, {
                  ...args,
                  value: o[k[0]],
                }, _lib),
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
    typeof: {
      args: ["value"],
      fn: (value) => typeof value
    },
    construct: {
      args: ["args", "__graph_value", "_lib"],
      fn: (args, nodevalue, _lib) => new (Function.prototype.bind.apply(
        nodysseus_get(_lib.data, nodevalue, _lib, window[nodevalue]), 
        [null, ...(args === undefined ? [] : Array.isArray(args) ? args : [args])])
      )
    },
    addEventListeners: {
      args: ["target", "_node_args", "_lib"],
      fn: (target, nodeargs, lib: Lib) => {
        Object.entries(nodeargs)
        .filter(kv => kv[0] !== "target")
        .forEach(([k, fn]: [string, Runnable]) => target[k] = event => fn && run_runnable(fn, lib, {event}))
        return target;
      }
    }
  },
  // THREE
};

export {nolib, initStore, compare, hashcode, ispromise, NodysseusError, base_graph, base_node, resfetch };
