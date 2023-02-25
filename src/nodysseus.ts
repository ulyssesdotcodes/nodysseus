import set from "just-safe-set";
import loki from "lokijs";
import { ancestor_graph, ispromise, isWrappedPromise, mapMaybePromise, node_args, WrappedPromise, wrapPromise, wrapPromiseAll, base_graph, base_node, runnableId } from "./util"
import { isNodeGraph, Graph, LokiT, NodysseusNode, NodysseusStore, Store, Result, Runnable, isValue, isNodeRef, RefNode, Edge, isFunctorRunnable, isApRunnable, ApRunnable, FunctorRunnable, isConstRunnable, ConstRunnable, isRunnable, isNodeScript, InputRunnable, isInputRunnable, Lib, Env, isEnv, isLib, Args, isArgs, ResolvedArgs, RunOptions, isError, FUNCTOR, CONST, AP, TypedArg } from "./types"
import { combineEnv,  newLib, newEnv, mergeEnv, mergeLib, } from "./util"
import generic from "./generic.js";
import { create_fn, expect, now } from "./externs";

const generic_nodes = generic.nodes;

const Nodysseus = (): NodysseusStore => {
  const isBrowser = typeof window !== 'undefined';
  const persistdb = new loki("nodysseus_persist.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  })
  const refsdb = persistdb.addCollection<LokiT<NodysseusNode>>("refs", {unique: ["id"]});

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

export const lokidbToStore = <T>(collection: loki.Collection<LokiT<T>>): Store<T> => ({
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
    if(existing !== undefined){
      collection.remove(existing);
    }
  },
  removeAll: () => collection.clear(),
  all: () => collection.where(_ => true).map(v => v.id),
  addMany: gs => gs.map(([id, data]) => collection.insert({id, data}))
})

let nodysseus: NodysseusStore;

let resfetch = typeof fetch !== "undefined" ? fetch : 
    (urlstr, params?) => import('node:https').then(https => new Promise<string | Response>((resolve, reject) => {
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

export const nodysseus_get = (obj: Record<string, any> | Args | Env, propsArg: string, lib: Lib, defaultValue=undefined, props: Array<string>=[], options: RunOptions = {}) => {
    let objArg = obj;
    obj = isEnv(obj) ? obj.data : obj
    let level = 0;
  if (!obj) {
    return defaultValue;
  }
  const naive = isArgs(obj) ? obj.get(propsArg) : obj[propsArg];
  if(naive !== undefined) {
    return naive;
  }

  var prop;
  if (props.length === 0) {
    if(typeof propsArg == 'string') {
      if(propsArg.includes(".")){
        props = propsArg.split('.')
      } else {
        props.push(propsArg)
      }
    }
    if (typeof propsArg == 'symbol' || typeof propsArg === 'number') {
      props.push(propsArg)
    }
  }

  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }

  while (props.length) {
    if(obj && isRunnable(obj)) {
        const ran = run_runnable(obj, lib, undefined, options)
        if(ispromise(ran)) {
          obj = ran;
          continue
        } else if (isValue(ran)) {
          obj = ran.value;
          continue;
        }
    }

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, propsArg, lib, defaultValue, props) : r)
    }

    prop = props[0];
    if((obj === undefined || typeof obj !== 'object' || 
        !(isArgs(obj) ? obj.has(prop) : obj[prop] !== undefined || (obj.hasOwnProperty && obj.hasOwnProperty(prop))))){
        return isEnv(objArg) ? nodysseus_get(objArg.env, propsArg, lib, defaultValue, props) : defaultValue;
    }

    props.shift();

    obj = isArgs(obj) ? obj.get(prop) : obj[prop];

    if(obj && ispromise(obj)){
        return obj.then(r => props.length > 0 ? nodysseus_get(r, propsArg, lib, defaultValue, props) : r)
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

function compareObjects(value1, value2, isUpdate = false) {
    if (value1._needsresolve || value2._needsresolve) {
        return false;
    }

    const keys1 = Object.keys(value1);
    const keys2 = !isUpdate && Object.keys(value2);

    if (!isUpdate && keys1.length !== keys2.length) {
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

        if(node.value.startsWith("0x")) {
          const int = parseInt(node.value);
          if(!isNaN(int)) {
            return int;
          }
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

const node_nodes = (node, node_id, data, graph_input_value: Env, lib: Lib, options: RunOptions) => {
    return run_graph(node, node_id, combineEnv(data, graph_input_value, "nodenodes" + node_id, graph_input_value._output), lib, options)
}

const node_script = (node, nodeArgs: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
    let orderedargs = ["", ...nodeArgs.keys()].join(", ");

    // const data = {};
    const data = resolve_args(nodeArgs, lib, options.resolvePromises ? options : {...options, resolvePromises: true});
    // for(let i of nodeArgs.keys()) {
    //     orderedargs += ", " + i;
    //     if(nodeArgs.has(i)){
    //         let graphval;
    //         while(isConstRunnable(graphval)) {
    //           graphval = wrapPromise(run_runnable(graphval ?? nodeArgs.get(i), lib, undefined, options)).then(gv => isError(gv) ? gv : gv?.value);
    //         }
    //         data[i] = graphval;
    //     }
    // }

    const name = node.name ? node.name.replace(/\W/g, "_") : node.id;
    const fn = lib.data.no.runtime.get_fn(node.id, name, orderedargs, node.script ?? node.value);

    return wrapPromise(data)//wrapPromiseAll(Object.values(data))
      .then(promisedData => lib.data.no.of(fn.apply(null, [lib.data, node, data, ...Object.values(isError(promisedData) ? promisedData : promisedData?.value ?? {})]))).value
}

const node_extern = (node: RefNode, data: Args, graphArgs: Env, lib: Lib, options: RunOptions) => {
    const libExternFn = node.value.startsWith("extern.") && node.value.substring(7);
    const extern = libExternFn ? lib.data.extern[libExternFn] : nodysseus_get(lib.data, node.value, lib);
    let argspromise = false;
    let argColonIdx;
    const isArgsArray = Array.isArray(extern.args);
    const externArgs: Array<[string, TypedArg]>  = isArgsArray ? extern.args.map(a => {
      argColonIdx = a.indexOf(":")
      return [argColonIdx >= 0 ? a.substring(0, argColonIdx) : a, "any"]
    }) : Object.entries(extern.args);
    const args = typeof extern === 'function' ?  resolve_args(data, lib, options) :  externArgs.map(([arg, argType]) => {
      let newval;
      if (arg === '_node') {
          newval = node 
      } else if (arg === '_node_args') {
        newval = extern.rawArgs ? data : resolve_args(data, lib, options)
        newval = ispromise(newval) ? newval.then((v: Result | undefined) => isError(v) ? v : v?.value)  : extern.rawArgs ? newval : newval.value
      } else if (arg == '_lib') {
          newval = lib;
      } else if (arg == '_graph_input_value') {
          newval = graphArgs;
      } else if (arg == '_runoptions') {
          newval = options;
      } else if (arg == '__graphid') {
          newval = (graphArgs.data.get("__graphid") as {value: string}).value;
      } else {
          newval = extern.rawArgs ? data.get(arg) : run_runnable(data.get(arg), lib, new Map(), options)
          newval = ispromise(newval) ? newval.then((v: Result) => isError(v) ? v : v?.value) : newval && !extern.rawArgs ? newval.value : newval;
      }

      argspromise ||= ispromise(newval);
      return newval
    });

    argspromise ||= ispromise(args)

    if (argspromise && !extern.promiseArgs) {
        return (Array.isArray(args) ? Promise.all(args) : (args as Promise<Result>).then(v => isValue(v) ? v.value.args : v)).then(as => {
            const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, isArgsArray ? as : [Object.fromEntries(externArgs.map((a, idx) => [a[0], as[idx]]))]);
            return mapMaybePromise(res, res => extern.rawArgs ? res : lib.data.no.of(res));
        })
    } else if(!ispromise(args)) {
        const resArgs = Array.isArray(args) ? args : isValue(args) ? args.value.args : args;
        const res = (typeof extern === 'function' ? extern :  extern.fn).apply(null, isArgsArray ? resArgs : [Object.fromEntries(externArgs.map((a, idx) => [a[0], resArgs[idx]]))]);
        return mapMaybePromise(res, res => extern.rawArgs ? res : lib.data.no.of(res));
    }
}

const resolve_args = (data: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
    let is_promise = false;
    const result = {}
    for(let kv of data.entries()){
      result[kv[0]] = kv[1] 
      while(isConstRunnable(result[kv[0]])) {
        result[kv[0]] = wrapPromise(result[kv[0]]).then(runnable => run_runnable(runnable, lib, undefined, options)).value;
      }
      if(result[kv[0]] instanceof Error) {
        return result[kv[0]]
      }
      is_promise = is_promise || !!kv[1] && ispromise(result[kv[0]]);
    }

    if (is_promise && options.resolvePromises) {
      const promises = [];
      Object.entries(result).forEach(kv => {
          promises.push(Promise.resolve(kv[1]).then((pv: Result) => isError(pv) ? pv : [kv[0], pv?.value]))
      })
      return Promise.all(promises).then(Object.fromEntries).then(v => lib.data.no.of(v));
    }

    // if(!options.resolvePromises && is_promise) {
    //   debugger;
    // }

    return lib.data.no.of(Object.fromEntries(
        Object.entries(result)
            .filter(d => !d[0].startsWith("__")) // filter out private variables
            .map((e: [string, Result]) => [e[0], isValue(e[1]) ? e[1].value : e[1]])
    ));

}

const node_data = (nodeArgs, graphArgs, lib, options) => {
  return nodeArgs.size === 0 ? lib.data.no.of(undefined) : resolve_args(nodeArgs, lib, options);
}

const createFunctorRunnable = (fn: Exclude<Runnable, Result | ApRunnable>, args: ConstRunnable, lib, options: RunOptions): FunctorRunnable | Promise<FunctorRunnable> => {
  const argsval = args && run_runnable(args, lib, undefined, options)
  const ret = fn && mapMaybePromise(argsval, args => isError(args) ? args : lib.data.no.of({
    __kind: FUNCTOR,
    fnargs: args ? [...new Set(args.value ? Object.keys(args.value).map(k => k.includes(".") ? k.substring(0, k.indexOf('.')) : k) : [])] : [],
    env: fn.env,
    graph: fn.graph,
    fn: fn.fn,
    lib: fn.lib
  }))
  return ret;
}

const run_runnable = (runnable: Runnable | undefined, lib: Lib, args: Map<string, any> = new Map(), options: RunOptions = {}): Result | Promise<Result> | undefined =>  {
  if(runnable === undefined || isError(runnable)) {
    return runnable as Result;
  }

  switch(runnable.__kind){
    case CONST:
      return run_graph((runnable as ConstRunnable).graph, runnable.fn, mergeEnv(args, runnable.env), runnable.lib, options);
    case AP:
      return run_ap_runnable(runnable, args, lib)
    case FUNCTOR:
      return run_functor_runnable(runnable, args, lib, options)
  }

  return runnable;
}


// graph, node, symtable, parent symtable, lib
const run_node = (node: NodysseusNode | Runnable, nodeArgs: Map<string, ConstRunnable>, graphArgs: Env, lib: Lib, options: RunOptions): Result | Promise<Result> => {
    if (isRunnable(node)){
      if(isError(node)) {
        return node;
      } else if(isValue(node)) {
        return node
      } else if (isApRunnable(node)) {
        throw new Error("Unexpected node")
      } else {
        const graphid = (graphArgs.data.get("__graphid") as {value: string}).value;
        const nodegraphargs: Env = node.env ?? newEnv(new Map(), graphArgs._output)
        nodegraphargs.data.set("__graphid", graphid ?? lib.data.no.of(node.graph.id));
        lib = mergeLib(node.lib, lib)

        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib, options)
      }
    } else if(isNodeRef(node)) {
        if (node.ref === "arg") {
            const resval = nolib.no.arg(node, graphArgs, lib, node.value, options);
            // return resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval);
            return wrapPromise(resval).then(resval => resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval)).value;
        } else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib, options)
        } else if (node.ref === "script") {
            return node_script(node, nodeArgs, lib, options)
        }


        const graphid = (graphArgs.data.get("__graphid") as {value: string}).value;
        const newgraphid = `${graphid}/${node.id}`
        const newGraphArgs = newEnv(new Map().set("__graphid", lib.data.no.of(newgraphid)), graphArgs._output);

        return wrapPromise(lib.data.no.runtime.get_ref(node.ref)).then(node_ref => {
          if (!node_ref) {
              throw new Error(`Unable to find ref ${node.ref} for node ${node.name || node.id}`)
          }
          if(node_ref.nodes) {
              lib.data.no.runtime.set_parent(newgraphid, graphid); // before so that change/update has the parent id
              // lib.data.no.runtime.update_graph(newgraphid)
          }

          const result = run_node(node_ref, node.value ? new Map(nodeArgs).set("__graph_value", lib.data.no.of(node.value)) : nodeArgs, newGraphArgs, lib, options)
          return result;


        }).value
    } else if (isNodeGraph(node)) {
        return node_nodes(node, node.out ?? "out", nodeArgs, graphArgs, lib, options)
    } else if (isNodeScript(node)){
        return node_script(node, nodeArgs, lib, options)
    } else if(Object.hasOwn(node, "value")) {
        return lib.data.no.of(node_value(node));
    } else {
        return node_data(nodeArgs, graphArgs, lib, options)
    }
}

// derives data from the args symbolic table
const create_data = (node_id, graph, graphArgs: Env, lib: Lib, options: RunOptions): Map<string, ConstRunnable> => {
    const inputs = lib.data.no.runtime.get_edges_in(graph, node_id);
    const data: Map<string, ConstRunnable> = new Map();
    let input: Edge;
    //TODO: remove
    const newgraphargs = graphArgs._output ? mergeEnv(new Map().set("_output", undefined), graphArgs) : graphArgs;
    // delete newgraphargs._output
    //

    // grab inputs from state
    for (let i = 0; i < inputs.length; i++) {
        input = inputs[i];

        const val: ConstRunnable = {__kind: CONST, graph, fn: input.from, env: newgraphargs, lib}
        // Check for duplicates
        if(data.has(input.as)) {
            const as_set = new Set()
            inputs.forEach(e => {
                if (as_set.has(e.as)) {
                    throw new NodysseusError(nodysseus_get(graphArgs, "__graphid", lib, undefined, undefined, options).value + "/" + node_id, `Multiple input edges have the same label "${e.as}"`)
                }
                as_set.add(e.as)
            })
        }
        data.set(input.as, val);
    }

    return data;
}

// handles graph things like edges
const run_graph = (graph: Graph | (Graph & {nodes: Array<NodysseusNode>, edges: Array<Edge>}), node_id: string, env: Env, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const handleError = e => {
        console.log(`error in node`);
        if (e instanceof AggregateError) {
            e.errors.map(console.error)
        } else {
            console.error(e);
        }
        if(e instanceof NodysseusError) {
            lib.data.no.runtime.publish("grapherror", e)
            return e;
        }
        const parentest = lib.data.no.runtime.get_parentest(graph)
        let error_node = parentest ? graph : node;
        lib.data.no.runtime.publish("grapherror", new NodysseusError(
            nodysseus_get(env, "__graphid", lib)?.value + "/" + error_node.id, 
            e instanceof AggregateError ? "Error in node chain" : e
        ))

        return e;
  }
    const newgraph = graph;
    const node = lib.data.no.runtime.get_node(newgraph, node_id);

    try {
        return wrapPromise(node).then(node => {
          lib.data.no.runtime.publish('noderun', {graph: newgraph, node_id})

          const data = create_data(node_id, newgraph, env, lib, options);

          if(options.profile && !nolib.no.runtime.get_parentest((env.data.get("__graphid") as {value: string}).value)) {
            const edgePath = edge => nolib.no.runtime.get_edge_out(newgraph, edge) ? [nolib.no.runtime.get_edge_out(newgraph, edge).as].concat(edgePath(nolib.no.runtime.get_edge_out(newgraph, edge).to)) : []
            let path = edgePath(node_id).join(" -> ");
            const id = `${(env.data.get("__graphid") as {value: string}).value}/${node.id} (${node.ref}) - ${path}`;
            if(options?.profile && id) {
              console.time(id)
              performance.mark(`${id} - begin`)
            }

            const result = run_node(node, data, env, lib, options);

            const isResPromise = ispromise(result);

            if(!ispromise(result) && options?.profile && id) {
              console.timeEnd(id)
              performance.mark(`${id} - end`);
              performance.measure(`${id}`, `${id} - begin`, `${id} - end`)
            }

            return isResPromise && options.profile && id ? result.then(v => {
                console.timeEnd(id)
                performance.mark(`${id} - end`);
                performance.measure(id, `${id} - begin`, `${id} - end`);
                return v;
              }) : result
          } else {
            return run_node(node, data, env, lib, options);
          }
        }).value
    } catch (e) {
      return handleError(e)
    }
}

const run_functor_runnable = (runnable: FunctorRunnable, args: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const execArgs: Args = new Map(runnable.fnargs?.map(k => [k, nodysseus_get(args, k, lib)]) ?? []);
  const newRunnable: ConstRunnable = {
    __kind: CONST,
    env: combineEnv((execArgs ?? new Map()).set("__graphid", runnable.env.data.get("__graphid")), runnable.env, "functor runnable" + runnable.fn),
    fn: runnable.fn,
    graph: runnable.graph,
    lib: runnable.lib
  }
  return run_runnable(newRunnable, lib, undefined, options)
}

const run_ap_runnable = (runnable: ApRunnable, args: Args, lib: Lib): Result | Promise<Result> => {
  const computedArgs = runnable.args && run_runnable({...runnable.args, lib: runnable.lib}, lib, args, {});
  const execute = (execArgs): WrappedPromise<any> => {
    const ret = (Array.isArray(runnable.fn) ? runnable.fn : [runnable.fn])
    .map(rfn => run_runnable(
      rfn,
      runnable.lib,
      execArgs?.value ? new Map(Object.entries(execArgs.value).filter(kv => kv[0] !== "__graphid").map(kv => [kv[0], lib.data.no.of(kv[1])])) : new Map(),
      {}
    ))
    return Array.isArray(runnable.fn) ? wrapPromiseAll(ret.map(v => wrapPromise(v))) : wrapPromise(ret[0]);
  }
  return wrapPromise(computedArgs).then(execute).then(v => v?.value).value;
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

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if(store !== undefined) {
    nodysseus = store;
  } else if(!nodysseus) {
    nodysseus = Nodysseus();
  }

  if(!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn()
  }
}

export const run = (node: Runnable | InputRunnable, args: ResolvedArgs | Record<string, unknown> = new Map(), options: {lib?: Lib, store?: NodysseusStore, profile?: boolean} = {}) => {
  initStore(options.store ?? nodysseus);

  let _lib: Lib = mergeLib(options.lib, newLib(nolib))
  if(isRunnable(node)) {
    if(isValue(node)) {
      return node.value;
    } else if (isError(node)) {
      return node;
    }
  }

  isRunnable(node) && isFunctorRunnable(node) && !_lib.data.no.runtime.get_ref(node.graph.id) && _lib.data.no.runtime.change_graph(node.graph)
  isRunnable(node) && isFunctorRunnable(node) && _lib.data.no.runtime.update_graph(node.graph, _lib);

  if(!(args instanceof Map)) {
    args = new Map(Object.entries(args));
  }

  const res = run_runnable(
    isRunnable(node) 
      ? {...node, lib: node.lib ? mergeLib(node.lib, _lib) :  _lib}
      : {...node, __kind: CONST, env: node.env ?? newEnv(new Map().set("__graphid", _lib.data.no.of(node.graph.id))), lib: mergeLib(node.lib, _lib)
        // mergeEnv(
        //   Object.fromEntries(Object.entries(args ?? {}).map(e => [e[0], _lib.data.no.of(e[1])])), 
        //   node.env ?? newEnv({__graphid: _lib.data.no.of(node.graph.id)})
        // )
      }, 
    _lib, args, options);
  return wrapPromise(res).then(r =>!isError(r) && r?.value).then(v => isArgs(v) ? Object.fromEntries(v) : v).value;
}

const nolib = {
  no: {
    of: <T>(value): Result | Promise<Runnable> => ispromise(value) ? value.then(nolib.no.of) : isValue(value) ? value : { __kind: "result", value: value},
    arg: (node, target: Env, lib: Lib, value, options: RunOptions) => {
      let valuetype, nodevalue;
      let colonIdx = value.indexOf(":")
      if(colonIdx >= 0) {
        nodevalue = value.substring(0, colonIdx);
        valuetype = value.substring(colonIdx + 2)
      } else {
        nodevalue = value;
      }

      const newtarget = () => {
        const newt = new Map(target.data);
        for(let k in newt) {
          if(k.startsWith("_")) {
            newt.delete(k)
          }
        }
        return newt;
      };

      const parenttarget = () => {
        const newt = new Map(target.env.data);
        for(let k in newt) {
          if(k.startsWith("_")) {
            newt.delete(k)
          }
        }
        return newt;
      };

      const ret = nodevalue === undefined || target === undefined
        ? undefined
        : nodevalue === "_node"
        ? node
        : nodevalue.startsWith("_node.")
        ? node[nodevalue.substring("_node.".length)]
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

      const retrun = isConstRunnable(ret) && valuetype !== "raw" ? run_runnable(ret, lib, undefined, options) : undefined;
      const r = ispromise(retrun) ? retrun.then(v => isError(v) ? v : v?.value) : retrun ? isValue(retrun) || isWrappedPromise(retrun) ? retrun?.value : retrun : ret;
      return r
    },
    base_graph,
    base_node,
    NodysseusError,
    runtime: undefined,
    runtimefn: (function () {

      const polyfillRequestAnimationFrame = typeof window !== "undefined" ? window.requestAnimationFrame : (fn => setTimeout(fn, 16))

      Object.values(generic_nodes).forEach(graph => {
        if(isNodeGraph(graph)) {
          graph.edges_in = Object.values(graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
        }
      })

      const event_listeners = new Map<string, Map<string, Function | Runnable>>();
      const event_listeners_by_graph = new Map();
      const event_data = new Map(); // TODO: get rid of this
      const getorsetgraph = (graph, id) => nodysseus.graphs.get(id) ?? (nodysseus.graphs.add(id, graph), graph)
      let animationframe;
      let animationerrors = [];

      const runpublish = (data, event, lib, options: RunOptions = {}) => {
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
              mergeLib(l.lib, lib),
              options
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
            publish("animationframe", undefined, lib, options);
          });
        }
      };

      const publish = (event, data, lib: Lib, options: RunOptions = {}) => {

        if (typeof data === "object" && ispromise(data)) {
          data.then(d => runpublish(d, event, lib, options));
        } else {
          runpublish(data, event, lib, options);
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
        lib: Lib = {__kind: "lib", data: nolib},
        options: RunOptions = {}
      ) => {
        const listeners = getorset(event_listeners, event, () => new Map());
        const fn =
          typeof input_fn === "function"
            ? input_fn
            : (args) => {
                run_runnable(input_fn, mergeLib(input_fn.lib, lib), args, options);
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

          if (event === "animationframe") {
            polyfillRequestAnimationFrame(() => publish(event, undefined, lib, options));
          }
        }

        if (remove) {
          remove_listener(event, listener_id);
        }

        listeners.set(listener_id, fn);

      };

      // Adding a listener to listen for errors during animationframe. If there are errors, don't keep running.
      add_listener('grapherror', "__animationerrors", e => animationerrors.push(e));
      add_listener('graphchange', "__animationerrors", e => {
        if(animationerrors.length > 0) {
          event_listeners.get("animationframe")?.clear();
        }
        animationerrors.splice(0, animationerrors.length)
      });

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
        // const old_graph = nodysseus.graphs.get(graph.id);
        // nodysseus.graphs.add(graph.id, graph)

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
          (lib.data ?? lib).no.runtime.update_graph(parent, lib);
        } else {
          publish("graphchange", graph, lib);
          publish("graphupdate", graph, lib);
        }
      };

      let updatepublish = {};
      const update_args = (graph, args, lib: Lib) => {
        const graphid = typeof graph === "string" ? graph : graph.id;
        let prevargs = nodysseus.state.get(graphid);

        if (prevargs === undefined) {
          prevargs = {};
          nodysseus.state.add(graphid, prevargs);
        }

        if (!compareObjects(args, prevargs, true)) {
          Object.assign(prevargs, args);
          const updatedgraph = get_parentest(graphid) ?? get_graph(graphid);
          if(!ispromise(updatedgraph) && !updatepublish[updatedgraph.id]) {
            updatepublish[updatedgraph.id] = true;
            requestAnimationFrame(() => {
              publish("graphupdate", updatedgraph, lib);
              updatepublish[updatedgraph.id] = false;
            })
          }
        }
      };

      const get_ref = (id, otherwise) => {
        return generic_nodes[id] ?? nodysseus.refs.get(id, otherwise && {...otherwise, id, nodes: {...otherwise.nodes, [otherwise.out ?? "out"]: {...otherwise.nodes[otherwise.out ?? "out"], name: id}}})
      }
      const add_ref = (graph: Node) => {
        return (Array.isArray(graph) ? graph : [graph]).map(graph => {
          if(generic_nodes[graph.id] === undefined) {
            return nodysseus.refs.add(graph.id, graph)
          }
        })[0]
      }
      const remove_ref = nodysseus.refs.remove

      const get_node = (graph: Graph, id: string) => wrapPromise(get_graph(graph)).then(g => g?.nodes[id]).value
      const get_edge = (graph, from) => wrapPromise(get_graph(graph)).then(g => g?.edges[from]).value
      const get_edges_in = (graph, id) => wrapPromise(get_graph(graph))
        .then(g => {
          const idEdgesIn = g.edges_in?.[id];
          if(idEdgesIn !== undefined) {
            return Object.values(idEdgesIn)
          } else if(g.edges_in === undefined) {
            return Object.values(g.edges).filter(e => e.to === id)
          }
          return []
        }).value
      const get_edge_out = get_edge

      const get_args = (graph) => nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {};
      const get_graph = (graph: string | Graph): Graph | Promise<Graph> | undefined => wrapPromise(
        nodysseus.refs.get(typeof graph === "string" ? graph : graph.id))
          .then(g => {
            return isNodeGraph(g) ? g : typeof graph !== "string" && isNodeGraph(graph) ? graph : undefined
          }).value
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

      // nodysseus.refs.addMany(Object.values((generic as Graph).nodes).map(n => [n.id, n]));

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
                )}(_lib, _node, _graph_input_value${orderedargs}){${script}}`
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
        delete_cache: () => nodysseus.state.removeAll(),
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
        add_node: (graph: Graph, node: NodysseusNode, lib: Lib) => {
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
          wrapPromise(get_graph(graph)).then(graph => {
            const graphId = typeof graph === "string" ? graph : graph.id;

            const parent_edge = (lib.data ?? lib).no.runtime.get_edge_out(graphId, id);
            const child_edges = (lib.data ?? lib).no.runtime.get_edges_in(graphId, id);

            const current_child_edges = (lib.data ?? lib).no.runtime.get_edges_in(graphId, parent_edge.to);
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
            if(changeEdges !== undefined) {
              child_edges.map(e => nodysseus.refs.remove_edge(graphId, e))
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
          })
        },
        add_listener,
        add_listener_extern: {
          args: ["event", "listener_id", "fn"],
          add_listener,
        },
        remove_listener,
        remove_graph_listeners,
        publish,
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
        undo: () => nodysseus.refs.undo && nodysseus.refs.undo(),
        redo: () => nodysseus.refs.redo && nodysseus.refs.redo(),
        store: nodysseus
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
            .then(r => resolveRunnable(isError(r) ? r : r.value)) : wrapPromise(runnable)

        const apRunnable = (fnRunnable: FunctorRunnable | ApRunnable | Array<FunctorRunnable | ApRunnable>): ApRunnable => ({
            __kind: AP,
            fn: Array.isArray(fnRunnable) ? fnRunnable.filter(v => v) : fnRunnable,
            args,
            lib
          })

        return fnResult
          .then(fnr => isError(fnr) ? fnr : Array.isArray(fnr.value) ? fnr.value.map(fnrv => resolveRunnable(fnrv).value) :  resolveRunnable(fnr.value).value)
          .then(fnr => !((Array.isArray(fnr) ? fnr : [fnr]).filter(fnrv => fnrv).every(fnrv => isApRunnable(fnrv) || isFunctorRunnable(fnrv))) ? fnr : run ? run_runnable(apRunnable(fnr as FunctorRunnable), lib) : apRunnable(fnr))
          .then(res => lib.data.no.of(res)).value
      }
    },
    create_fn: {
      args: ["runnable", "_lib"],
      fn: create_fn
    },
    switch: {
      rawArgs: true,
      args: ["input", "_node_args", "_lib", "_runoptions"],
      fn: (input, args: Args, lib: Lib, options) => {
        const inputval = run_runnable(input, lib, undefined, options);
        return ispromise(inputval) 
          ? inputval.then(ival => isError(ival) ? ival : run_runnable(isArgs(args) ? args.get(ival?.value) : args[ival?.value], lib, undefined, options)) 
          : isError(inputval)
          ? inputval
          : run_runnable(args.get(inputval?.value), lib, undefined, options);
      },
    },
    resolve: {
        rawArgs: false,
        args: ['object', '_lib'],
        fn: (object: Args, lib) => {
            return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]));
        }
    },
    fold: {
      rawArgs: true,
      args: ["fn", "object", "initial", "_lib", "_runoptions"],
      fn: (fn, object, initial, lib: Lib, options) =>
        wrapPromise(run_runnable(object, lib, undefined, options))
          .then(ov => isError(ov) ? ov : ov.value)
          .then(objectvalue => 
            objectvalue === undefined ? undefined 
            : wrapPromise(run_runnable(fn, lib, undefined, options))
                .then(fnr => isError(fnr) ? fnr : fnr.value)
                .then(fnrunnable =>
                  wrapPromise(run_runnable(initial, lib, undefined, options))
                    .then(initial => isError(initial) ? initial : initial.value)
                    .then(initial => {
                      const mapobjarr = (mapobj, mapfn, mapinit) =>
                        typeof mapobj.reduce === "function"
                          ? mapobj.reduce(mapfn, mapinit)
                          : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit);

                      initial = initial ?? (typeof objectvalue.reduce === "function" ? [] : {});

                      let errored = false;
                      const errorlistener = (error) => errored = true;

                      // TODO: rethink. Too costly for now
                      // lib.data.no.runtime.add_listener('grapherror', fnrunnable.graph.id + "/" + fnrunnable.fn, errorlistener)

                      const ret = mapobjarr(
                        objectvalue,
                        (previousValue, currentValue) =>
                          !errored && wrapPromise(previousValue).then(prevVal => {
                            const args = new Map().set("previousValue", lib.data.no.of(prevVal)).set("currentValue", lib.data.no.of(currentValue))
                            return run_runnable(fnrunnable, lib,
                            args, options
                          )}).then(rv => {
                            if(isError(rv)) {
                              errored = true;
                              return rv;
                            }
                            return rv.value;
                          }).value,
                        initial
                      );

                      // lib.data.no.runtime.remove_listener('grapherror', fnrunnable.graph.id + "/" + fnrunnable.fn, errorlistener)

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
      args: ["fn", "args", "_lib", "_runoptions"],
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
        "metadata",
        "args",
        "lib",
        "_node",
        "_graph",
        "_graph_input_value",
        "_lib",
        "_runoptions"
      ],
      fn: (
        value,
        display,
        subscribe,
        metadata,
        argsfn,
        lib,
        _node,
        _graph,
        _args,
        _lib: Lib,
        options
      ) => {
        const output = _args._output;
        const edgemap = { value, display, subscribe, metadata, lib };
        const runedge = output && output === display ? display : edgemap[output] ? output : "value";

        const return_result = (_lib: Lib, args: Args) => {
          args = args && !isArgs(args) ? new Map(Object.entries(args)) : args;
          const runnable = edgemap[runedge] ? {...edgemap[runedge]} : runedge === "value" && !value && display ? display : _lib.data.no.of(undefined);
          if(isRunnable(runnable) && !isError(runnable) && !isValue(runnable) && !isApRunnable(runnable)) {
            runnable.env = combineEnv(runnable.env.data, newEnv(args, _lib.data.no.of(runedge === "display" ? "display" : "value"), runnable.env))
          }

          if(lib !== undefined) {
            runnable.lib = _lib;
          }

          const runedgeresult = run_runnable(runnable, _lib, undefined, options)
            // edgemap[runedge]
            // ? run_runnable(edgemap[runedge], _lib, Object.assign(
            //   { _output: _lib.data.no.of(runedge === "display" ? "display" : "value") },
            // ))
            // : runedge === "value" && !value && display
            // ? run_runnable(display, _lib, args)
            // : _lib.data.no.of(undefined)

          if (edgemap.subscribe) {
            const graphid = (subscribe.env.data.get("__graphid") as {value: string}).value;
            const newgraphid = graphid + "/" + _node.id;


            wrapPromise(run_runnable(
              edgemap.subscribe,
              _lib,
              args,
              options
            ))
            .then(subscriptions => isError(subscriptions) ? subscriptions : subscriptions.value)
            .then(subscriptions => Object.entries(subscriptions)
                .forEach(kv => kv[1] &&
                  _lib.data.no.runtime.add_listener(kv[0], 'subscribe-' + newgraphid, kv[1], false, 
                    graphid, true, _lib, options)))
          }

          return runedgeresult;
        }

        const ret = wrapPromise(run_runnable(lib, _lib, undefined, {...options, resolvePromises: true}))
            .then(lib => isError(lib) ? lib : lib?.value)
            .then(lib => wrapPromise(argsfn ? run_runnable({
                ...argsfn,
                lib: mergeLib(lib, _lib)
              }, _lib, undefined, {...options, isNoResolve: true, resolvePromises: true}) : undefined)
              .then(args => return_result(mergeLib(lib, _lib), isValue(args) ? args?.value : args))).value
        return ret;
      },
    },
    compare: {
      args: ["_node_args"],
      fn: (args) => compare(args[0], args[1])
    },
    eq: ({ a, b }) => a === b,
    get: {
      args: ["_graph", "target", "path", "def", "graphval", "_lib"],
      fn: (graph, target, path, def, graph_value, lib: Lib) => {
        return nodysseus_get(
          target,
          graph_value || path,
          lib, 
          def
        );
      },
    },
    set: {
      args: ["target: default", "path", "value", "__graph_value", "_graph_input_value"],
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
      args: ["_node", "_node_args", "_graph", "_lib", "_graph_input_value", "_runoptions"],
      fn: (node, node_inputs, graph, _lib, _graph_input_value, options) =>
        node_script(
          node,
          node_inputs,
          _lib,
          options
        ),
    },
    new_array: {
      args: ["_node_args", "__graph_value"],
      fn: (args, nodevalue) => nodevalue ? nodevalue.split(/,\s+/)
        : wrapPromiseAll(Object.entries(args).sort((akv, bkv) => akv[0].localeCompare(bkv[0])).map((kv: [string, any]) => wrapPromise(kv[1]))).then(r => r.map(rv => isValue(rv) ? rv.value : rv)).value
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
    update_args: {
      promiseArgs: true,
      args: ["path", "value", "__graphid", "_lib"],
      resolve: false,
      fn: (path, value, graphid, lib) => {
        const pathresult = run_runnable(path, lib) as Result;
        path = isValue(pathresult) ? pathresult.value : pathresult;
        const result = run_runnable(value, lib);

        if(isError(pathresult)) {
          throw pathresult;
        }

        const promiseresult = ispromise(result) ? result.then(r => isValue(r) ? r.value : r) : isValue(result) ? result.value : result;

        lib.data.no.runtime.update_args(graphid, {[path]: promiseresult});

        return promiseresult
      }
    },
    call: {
      resolve: true,
      args: {"__graph_value": "system", "self": {type: "any", default: true}, "fn": "value", "args": "array", "_lib": "lib"},
      fn: ({__graph_value, self, fn, args, _lib}) => {
        let nodevalue = __graph_value;
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
            const ng_fn = nodysseus_get(self ?? _lib.data, fn || nodevalue, _lib);
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
            const ret = _lib.data.no.of(ispromise(ng_fn)
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
      args: ["target", "path", "fn", "_node", "_lib", "_graph_input_value", "_runoptions"],
      resolve: false,
      fn: (target, path, fn, node, _lib, args, options) => {
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
                }, _lib, options),
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
        .forEach(([k, fn]: [string, Runnable]) => target[k] = event => fn && run_runnable(fn, lib, new Map().set("event", event)))
        return target;
      }
    }
  },
  // THREE
};

export {nolib, initStore, compare, hashcode, ispromise, NodysseusError, resfetch, resolve_args };
