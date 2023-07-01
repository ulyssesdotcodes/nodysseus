import { ancestor_graph, ispromise, isWrappedPromise, mapMaybePromise, WrappedPromise, wrapPromise, wrapPromiseAll, base_graph, base_node, runnableId, compareObjects, descendantGraph } from "./util"
import { isNodeGraph, Graph, NodysseusNode, NodysseusStore, Store, Result, Runnable, isValue, isNodeRef, RefNode, Edge, isFunctorRunnable, isApRunnable, ApRunnable, FunctorRunnable, isConstRunnable, ConstRunnable, isRunnable, isNodeScript, InputRunnable, isInputRunnable, Lib, Env, isEnv, isLib, Args, isArgs, ResolvedArgs, RunOptions, isError, FUNCTOR, CONST, AP, TypedArg, ApFunctorLike, ApFunction, isApFunction, isApFunctorLike, EdgesIn, Extern, getRunnableGraph } from "./types"
import { combineEnv,  newLib, newEnv, mergeEnv, mergeLib, } from "./util"
import generic from "./generic.js";
import * as externs from "./externs";
import { v4 as uuid } from "uuid";
import { initListeners } from "./events";
import { wrap } from "idb";
import { parser } from "@lezer/javascript";

const generic_nodes = generic.nodes;

export const mapStore = <T>(): Store<T> => {
  const map = new Map<string, T>();

  return {
    get: id => map.get(id),
    set: (id, data: T) => (map.set(id, data), data),
    delete: id => map.delete(id),
    clear: () => map.clear(),
    keys: () => [...map.keys()]
  }
}


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
  cause: {node_id: string}
    constructor(node_id, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NodysseusError);
        }

        this.cause = {node_id};
    }
}

const node_value = (node) => externs.parseValue(node.value);
const node_nodes = (node, node_id, data, graph_input_value: Env, lib: Lib, options: RunOptions) => {
    return run_graph(node, node_id, combineEnv(data, graph_input_value, node_id, graph_input_value._output), lib, options)
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

const run_extern = (extern: ApFunction, data: Args, lib: Lib, options: RunOptions, node?: NodysseusNode, graphArgs?: Env) => {
  if(graphArgs?._output && graphArgs._output !== "value" && !extern.outputs?.[graphArgs._output]) {
    return undefined
  }

  let argColonIdx;
  let argspromise = false;
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
    } else if (arg == '_output') {
        newval = graphArgs._output;
    } else {
        newval = extern.rawArgs ? data.get(arg) : run_runnable(data.get(arg), lib, new Map(), options)
        while(isConstRunnable(newval) && !extern.rawArgs) {
          newval = run_runnable(newval, lib, new Map(), options)
        }
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

const node_extern = (node: RefNode, data: Args, graphArgs: Env, lib: Lib, options: RunOptions) => {
    const libExternFn = node.value.startsWith("extern.") && node.value.substring(7);
    return run_extern(libExternFn ? lib.data.extern[libExternFn] : nodysseus_get(lib.data, node.value, lib), data, lib, options, node, graphArgs);
}

const resolve_args = (data: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
    let is_promise = false;
    const result = {}
    for(let k of data.keys()){
      let val: Result | ConstRunnable | Promise<Result> = data.get(k);
      // console.log(`start ${k}`, val)
      const resarg = (argval) => wrapPromise(isValue(argval) ? argval.value : argval).then(runnable => isConstRunnable(runnable) ? resarg(run_runnable(runnable, lib, undefined, options)) : runnable).value;
      val = resarg(val);
      // while(isConstRunnable(val as Runnable)) {
      //   val = wrapPromise(val).then(runnable => run_runnable(runnable, lib, undefined, options)).value;
      // }

      // console.log(`end ${k}`, val);
      if(val instanceof Error) {
        return val
      }
      is_promise = is_promise || !!val && ispromise(val);
      result[k] = val;
    }

    if (is_promise && options.resolvePromises) {
      const promises = [];
      Object.entries(result).forEach(kv => {
          promises.push(Promise.resolve(kv[1]).then((pv: Result) => isError(pv) ? pv : [kv[0], isValue(pv) ? pv?.value : pv]))
      })
      return Promise.all(promises).then(Object.fromEntries).then(v => lib.data.no.of(v));
    }

    // if(!options.resolvePromises && is_promise) {
    //   debugger;
    // }
    for(let k of Object.keys(result)) {
      if(k.startsWith("__")){
        delete result[k]
      } else if(isValue(result[k])) {
        result[k] = result[k].value;
      }
    }

    return lib.data.no.of(result);

}

const node_data = (nodeArgs, graphArgs: Env, lib, options) => {
  return nodeArgs.size === 0 || graphArgs._output === "display" ? lib.data.no.of(undefined) : resolve_args(nodeArgs, lib, options);
}

const createFunctorRunnable = (fn: Exclude<Runnable, Result | ApRunnable>, parameters: ConstRunnable, lib, options: RunOptions): FunctorRunnable | Promise<FunctorRunnable> => {
  const argsval = parameters && run_runnable(parameters, lib, undefined, options)
  const ret = fn && mapMaybePromise(argsval, args => isError(args) ? args : lib.data.no.of({
    __kind: FUNCTOR,
    parameters: args ? [...new Set(args.value ? Object.keys(args.value).map(k => k.includes(".") ? k.substring(0, k.indexOf('.')) : k) : [])] : [],
    env: fn.env,
    graph: typeof fn.graph === "string" ? fn.graph : fn.graph.id,
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
      return wrapPromise(getRunnableGraph(runnable, lib))
        .then(graph =>
            wrapPromise(
              run_graph(graph, runnable.fn, mergeEnv(args, runnable.env), runnable.lib, options), 
              e => handleError(e, lib, runnable.env, runnable.graph, runnable.fn)).value).value;
    case AP:
      return run_ap_runnable(runnable, args, lib, options)
    case FUNCTOR:
      return wrapPromise(
        run_functor_runnable(runnable, args, lib, options),
        e => handleError(e, lib, runnable.env, runnable.graph, runnable.fn)
      ).value;
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
        nodegraphargs.data.set("__graphid", graphid ?? lib.data.no.of(node.graph));
        lib = mergeLib(node.lib, lib)

        return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib, options)
      }
    } else if(isNodeRef(node)) {
        if (node.ref === "arg") {
          if(graphArgs._output === "metadata") {
            const keys = [];
            let env = graphArgs;
            do {
              for(let k of env.data.keys()) {
                keys.push(k);
              }
              env = env.env;
            } while(env);
            return lib.data.no.of({
              values: keys
            })
          }
            const resval = nolib.no.arg(node, graphArgs, lib, node.value, options);
            // return resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval);
            return wrapPromise(resval).then(resval => resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval)).value;
        } else if (node.ref === "extern") {
            return node_extern(node, nodeArgs, graphArgs, lib, options)
        } else if (node.ref === "@js.script") {
            return (graphArgs._output === undefined || graphArgs._output === "value") && node_script(node, nodeArgs, lib, options)
        }

        const graphid = (graphArgs.data.get("__graphid") as {value: string}).value;
        const newgraphid = `${graphid}/${node.id}`
        const newGraphArgs = newEnv(new Map().set("__graphid", lib.data.no.of(newgraphid)), graphArgs._output);

        return wrapPromise(lib.data.no.runtime.get_ref(node.ref), e => handleError(e, lib, graphArgs, graphid, node)).then(node_ref => {
          if (!node_ref) {
              throw new Error(`Unable to find ref ${node.ref} for node ${node.name || node.id}`)
          }

          // before so that change/update has the parent id
          // change both nodes with nested graphs and non-
          lib.data.no.runtime.set_parent(newgraphid, graphid); 

          const result = run_node(node_ref, node.value ? new Map(nodeArgs).set("__graph_value", lib.data.no.of(node.value)) : nodeArgs, newGraphArgs, lib, options)
          return result;


        }).value
    } else if (isNodeGraph(node)) {
      node.edges_in = node.edges_in ?? Object.values(node.edges).reduce<Graph["edges_in"]>((acc, e) => ({...acc, [e.to]: {...(acc[e.to] ?? {}), [e.from]: e}}), {})
      return node_nodes(node, node.out ?? "out", nodeArgs, graphArgs, lib, options)
    } else if (isNodeScript(node)){
        return (graphArgs._output === undefined || graphArgs._output === "value") && node_script(node, nodeArgs, lib, options)
    } else if(Object.hasOwn(node, "value")) {
        return (graphArgs._output === undefined || graphArgs._output === "value") && lib.data.no.of(node_value(node));
    } else {
        return (graphArgs._output === undefined || graphArgs._output === "value") && node_data(nodeArgs, graphArgs, lib, options)
    }
}

// derives data from the args symbolic table
const create_data = (node_id: string, graph: Graph, graphArgs: Env, lib: Lib, options: RunOptions): Map<string, ConstRunnable> | Promise<Map<string, ConstRunnable>> => {
    return wrapPromise(lib.data.no.runtime.get_edges_in(graph, node_id)).then(inputs => {
        const data: Map<string, ConstRunnable> = new Map();
        let input: Edge;
        //TODO: remove
        const newgraphargs = graphArgs._output ? mergeEnv(new Map().set("_output", undefined), graphArgs) : graphArgs;
        // delete newgraphargs._output
        //

        // grab inputs from state
        for (let i = 0; i < inputs.length; i++) {
            input = inputs[i];

            const val: ConstRunnable = {__kind: CONST, graph: graph.id, fn: input.from, env: newgraphargs, lib}
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
      }).value;
}

  const handleError = (e, lib, env, graph, node) => {
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

// handles graph things like edges
const run_graph = (graph: Graph, node_id: string, env: Env, lib: Lib, options: RunOptions): Result | Promise<Result> => {
    const newgraph = graph;
    const node = lib.data.no.runtime.get_node(newgraph, node_id);

    if(!node) {
      // If a runnable is called after its fn is deleted but before it's recalculated, the ndoe won't exist. Instead of erroring, just return undefined.
      return;
    }

    try {
        return wrapPromise(node).then(node => wrapPromise(create_data(node_id, newgraph, env, lib, options)).then(data => ({node, data})).value)
          .then(({node, data}) => {
            const graphid = (env.data.get("__graphid") as {value: string}).value;
            if(!graphid.includes('/')) {
              lib.data.no.runtime.publish('noderun', {graph: newgraph, node_id})
            }


            if(options.profile && !nolib.no.runtime.get_parentest((env.data.get("__graphid") as {value: string}).value)) {
              const edgePath = edge => {
                const edgeout = nolib.no.runtime.get_edge_out(newgraph, edge)
                return edgeout && !ispromise(edgeout) ? [nolib.no.runtime.get_edge_out(newgraph, edge).as]
                  .concat(edgePath(nolib.no.runtime.get_edge_out(newgraph, edge).to)) 
                : ["promise"]
              }
              let path = edgePath(node_id).reverse().join(" -> ");
              let start = performance.now();
              const id = `${path} - ${(env.data.get("__graphid") as {value: string}).value}/${node.id} (${node.ref})`;
              // if(options?.profile && id) {
              //   console.time(id)
              //   performance.mark(`${id} - begin`)
              // }
              if(!options.timings) {
                options.timings = {};
              }

              const result = run_node(node, data, env, lib, options);

              const isResPromise = ispromise(result);

              if(!ispromise(result) && options?.profile && id) {
                // console.timeEnd(id)
                // performance.mark(`${id} - end`);
                // performance.measure(`${id}`, `${id} - begin`, `${id} - end`)
                options.timings[id] = (options.timings[id] ?? 0) + (performance.now() - start)
              }

              return isResPromise && options.profile && id ? result.then(v => {
                  // console.timeEnd(id)
                  // performance.mark(`${id} - end`);
                  // performance.measure(id, `${id} - begin`, `${id} - end`);
                  options.timings[id] = (options.timings[id] ?? 0) + (performance.now() - start)
                  return v;
                }) : result
            } else {
              return run_node(node, data, env, lib, options);
            }
          }).value
    } catch (e) {
      return handleError(e, lib, env, graph, node)
    }
}

const run_functor_runnable = (runnable: FunctorRunnable, args: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const execArgs: Args = new Map(runnable.parameters?.map(k => [k, nodysseus_get(args, k, lib)]) ?? []);
  const newRunnable: ConstRunnable = {
    __kind: CONST,
    env: combineEnv((execArgs ?? new Map()).set("__graphid", runnable.env.data.get("__graphid")), runnable.env, runnable.fn),
    fn: runnable.fn,
    graph: runnable.graph,
    lib: runnable.lib
  }
  return run_runnable(newRunnable, lib, undefined, options)
}

const run_ap_runnable = (runnable: ApRunnable, args: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  return wrapPromise(isRunnable(runnable.args) 
    ? run_runnable(runnable.args, lib, args, {...options, resolvePromises: false}) 
    : lib.data.no.of(runnable.args?.data ?? args))
        .then(ranArgs => {
          const execArgs = isValue(ranArgs) 
            ? ranArgs.value instanceof Map 
              ? ranArgs.value 
              : new Map([...Object.entries(ranArgs.value)].filter(kv => kv[0] !== "__graphid").map(kv => [kv[0], lib.data.no.of(kv[1])])) 
            : ranArgs instanceof Map
            ? ranArgs
            : new Map();
          const ret = (Array.isArray(runnable.fn) ? runnable.fn : [runnable.fn])
          .map(rfn => {
            return typeof rfn === "function" 
            ? wrapPromise(rfn(execArgs)).then(r => lib.data.no.of(r)).value 
            : isApFunction(rfn)
            ? run_extern(rfn, execArgs, lib, options)
            : run_runnable(
              rfn as Runnable,
              runnable.lib,
              execArgs,
              options
            )
          })
          return Array.isArray(runnable.fn) ? wrapPromiseAll(ret.map(v => wrapPromise(v))) : wrapPromise(ret[0]);
        }).then(v => {
          return isError(v) ? v : v?.value
        }).value;
}

const getmap = (map, id) => {
    return id ? map.get(id) : id;
}

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if(store !== undefined) {
    nodysseus = store;
  }

  if(!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn()
  }
}

export const run = (node: Runnable | InputRunnable, args: ResolvedArgs | Record<string, unknown> = new Map(), options: {lib?: Lib, store?: NodysseusStore} & RunOptions = {}) => {
  initStore(options.store ?? nodysseus);

  let _lib: Lib = mergeLib(options.lib, newLib(nolib))
  const nodeGraph = getRunnableGraph(node, _lib);
  const cachedGraphLib = nodeGraph && nodysseus.state.get(`${nodeGraph.id}-lib`);
  if(cachedGraphLib) {
    _lib = mergeLib(cachedGraphLib, _lib);
  }
  if(isRunnable(node)) {
    if(isValue(node)) {
      return node.value;
    } else if (isError(node)) {
      return node;
    }
  }

  // isRunnable(node) && isFunctorRunnable(node) && getRunnableGraph(node, _lib) && _lib.data.no.runtime.change_graph(node.graph)
  // isRunnable(node) && isFunctorRunnable(node) && _lib.data.no.runtime.update_graph(node.graph, _lib);

  if(!(args instanceof Map)) {
    args = new Map(Object.entries(args));
  }

  for(let k of args.keys()) {
    if(!isValue(args.get(k) as Runnable)) {
      args.set(k, nolib.no.of(args.get(k)))
    }
  }

  const res = run_runnable(
    isRunnable(node) 
      ? {...node, lib: node.lib ? mergeLib(node.lib, _lib) :  _lib}
      : {...node, __kind: CONST, env: node.env ?? newEnv(new Map().set("__graphid", _lib.data.no.of(node.graph))), lib: mergeLib(node.lib, _lib)
        // mergeEnv(
        //   Object.fromEntries(Object.entries(args ?? {}).map(e => [e[0], _lib.data.no.of(e[1])])), 
        //   node.env ?? newEnv({__graphid: _lib.data.no.of(node.graph.id)})
        // )
      }, 
    _lib, args, options);
  return wrapPromise(res)
    .then(r => isValue(r) ? r?.value : r)
    .then(v => (options.profile && console.log(JSON.stringify(options.timings, null, 2)), isArgs(v) ? Object.fromEntries(v) : v)).value;
}

const runtimefn = () => {
      Object.values(generic_nodes).forEach(graph => {
        if(isNodeGraph(graph)) {
          graph.edges_in = Object.values(graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
        }
      })

      const {publish, addListener, removeListener, pauseGraphListeners, togglePause, isGraphidListened, isListened} = initListeners();

      const change_graph = (graph: Graph | string, lib: Lib, changedNodes: Array<string> = [], broadcast = false, source?): Graph | Promise<Graph>=>
        wrapPromise(get_parentest(graph))
          .then(parent => {
          if (parent) {
            return (lib.data ?? lib).no.runtime.change_graph(parent, lib, [(typeof graph === "string" ? graph : graph.id).substring(parent.id.length + 1)]);
          } else {
            return wrapPromise(typeof graph === "string" ? get_ref(graph) : graph)
              .then(graph => {
                const changedNodesSet = new Set()
                while(changedNodes.length > 0) {
                  const node = changedNodes.pop();
                  if(!changedNodesSet.has(node)){
                    changedNodesSet.add(node);
                    Object.keys(descendantGraph(node, graph, lib).nodes).forEach(n => changedNodes.push(n));
                  }
                }
                publish("graphchange", {graph, dirtyNodes: [...changedNodesSet.keys()], source}, lib, {}, broadcast);
                publish("graphupdate", {graph, dirtyNodes: [...changedNodesSet.keys()], source}, lib, {}, broadcast);
                return graph;
              }).value;
          }
        }).value;

      let updatepublish = {};
      const update_args = (graph, args, lib: Lib) => {
        const graphid = typeof graph === "string" ? graph : graph.id;
        let prevargs = nodysseus.state.get(graphid);

        if (prevargs === undefined) {
          prevargs = {};
          nodysseus.state.set(graphid, prevargs);
        }

        if (!compareObjects(args, prevargs, true)) {
          Object.assign(prevargs, args);
          wrapPromise(get_parentest(graphid))
            .then(parent => parent ?? get_graph(graphid))
            .then(updatedgraph => {
              if(updatedgraph && !ispromise(updatedgraph) && (!updatepublish[updatedgraph.id] || updatepublish[updatedgraph.id] + 16 < performance.now())) {
                updatepublish[updatedgraph.id] = performance.now();
                setTimeout(() => {
                  updatepublish[updatedgraph.id] = false;
                  // TODO: fix the use of / here
                  let node_id = graph.split(updatedgraph.id)[1].substring(1);
                  node_id = node_id.indexOf('/') > 0 ? node_id.substring(0, node_id.indexOf('/')) : node_id;

                  publish("graphupdate", {graph: updatedgraph, dirtyNodes: node_id && Object.keys(descendantGraph(node_id, updatedgraph, lib).nodes)}, lib);
                }, 16)
              }
            }).value
        }
      };

      const get_ref = (id, otherwise?) => {
        return wrapPromise(generic_nodes[id] ?? nodysseus.refs.get(id)).then(graph => {
          return graph ?? (otherwise && nodysseus.refs.set(id, {...otherwise, id, nodes: {...otherwise.nodes, [otherwise.out ?? "out"]: {...otherwise.nodes[otherwise.out ?? "out"], name: id}}}))
        }).value;
      }
      const add_ref = (graph: NodysseusNode) => {
        return (Array.isArray(graph) ? graph : [graph])
          .map(graph => {
            if(generic_nodes[graph.id] === undefined) {
              nodysseus.refs.set(graph.id, graph)
              return graph;
            }
          })[0]
      }
      const remove_ref = (id) => 
        wrapPromise(nodysseus.refs.keys()).then(keys => {
          if(keys.includes(id)) {
            nodysseus.refs.delete(id);
          } else {
            keys.filter(k => k.startsWith(`@${id}`))
              .forEach(k => nodysseus.refs.delete(k))
          }
        }).value

      const get_node = (graph: Graph, id: string) => graph.nodes[id]
      const get_edge = (graph, from) => wrapPromise(get_graph(graph)).then(g => g?.edges[from]).value
      const get_edges_in = (graph: Graph, id) => Object.hasOwn(graph.edges_in, id) ? Object.values(graph.edges_in[id]) : []
      // wrapPromise(get_graph(graph))
      //   .then(g => {
      //     if(g.edges_in === undefined) {
      //       return Object.values(g.edges).filter(e => e.to === id);
      //     }
      //
      //     const idEdgesIn = g.edges_in?.[id];
      //     if(idEdgesIn !== undefined) {
      //       return Object.values(idEdgesIn)
      //     }
      //     return []
      //   }).value
      const get_edge_out = get_edge

      const get_args = (graph) => nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {};
      const get_graph = (graph: string | Graph): Graph | Promise<Graph> | undefined => wrapPromise(
        nodysseus.refs.get(typeof graph === "string" ? graph : graph.id))
          .then((g: NodysseusNode) => {
            return isNodeGraph(g) ? g : typeof graph !== "string" && isNodeGraph(graph) ? graph : undefined
          }).value
      const get_parent = (graph) => {
        const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return wrapPromise(parent).then(parent => parent && get_graph(parent.parent)).value;
      };
      const get_parentest = (graph) => {
       const parent = nodysseus.parents.get(
          typeof graph === "string" ? graph : graph.id
        );
        return wrapPromise(parent).then(parent => parent && parent.parentest && get_graph(parent.parentest)).value;
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
        run: run,
        get_ref,
        add_ref,
        add_refs: (gs) => gs.forEach(g => nodysseus.refs.set(g.id, g)),
        addRefsFromUrl: (url: string) => nodysseus.refs.addFromUrl(url),
        remove_ref,
        get_node,
        get_edge,
        get_edges_in,
        get_edge_out,
        get_parent,
        get_parentest,
        get_fn: (id, name, orderedargs, script): Function => {
          const fnid = id;
          return wrapPromise(nodysseus.fns.get(fnid + orderedargs)).then(fn => {
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

            nodysseus.fns.set(fnid + orderedargs, fn)
          }

          return fn.fn;
        }).value
        },
        change_graph,
        update_graph: (graphid, lib: Lib) => publish('graphupdate', {graph: graphid}, lib),
        update_args,
        clearState: () => nodysseus.state.clear(),
        delete_cache: () => {
          publish("cachedelete", {}, newLib(nolib))
        },
        clearListeners: () => {
          publish("listenersclear", {}, newLib(nolib))
        },
        get_graph,
        get_args,
        get_path,
        add_asset: (id, b) => nolib.no.runtime.store.assets.set(id, b),
        get_asset: (id, b) => id && nolib.no.runtime.store.assets.get(id),
        list_assets: () => nolib.no.runtime.store.assets.keys(),
        remove_asset: (id) => nolib.no.runtime.store.assets.delete(id),
        refs: () => nodysseus.refs.keys(),
        ref_graphs: () => nodysseus.refs.keys(),
        updateGraph: async ({graph, addedNodes = [], addedEdges = [], removedNodes = [], removedEdges = [], lib, dryRun = false}: {
          graph: string | Graph, 
          addedEdges?: Array<Edge>, 
          removedEdges?: Array<{[k in Exclude<keyof Edge, "as">]: Edge[k]}>, 
          addedNodes?: Array<NodysseusNode>, 
          removedNodes?: Array<NodysseusNode>, 
          lib: Lib, 
          dryRun?: boolean
        }): Promise<Graph> => {
          const graphId = typeof graph === "string" ? graph : graph.id;
          await Promise.resolve(nodysseus.refs.add_nodes_edges({graphId, addedNodes, addedEdges, removedEdges, removedNodes}))
          // if(Array.isArray(remove)) {
          //   await Promise.all(remove.map(e => nodysseus.refs.remove_edge(graphId, e)))
          // } else if (typeof remove === "object") {
          //   await Promise.resolve(nodysseus.refs.remove_edge(graphId, remove))
          // }
          // if(Array.isArray(add)) {
          //   await Promise.all(add.map(e => nodysseus.refs.add_edge(graphId, e)))
          // } else if (typeof add === "object") {
          //   await Promise.resolve(nodysseus.refs.add_edge(graphId, add))
          // }
          return change_graph(nodysseus.refs.get(graphId) as Graph, lib, addedEdges.flatMap(e => [e.from, e.to]));
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
          change_graph(nodysseus.refs.get(graphId) as Graph, lib, [node.id]);
        },
        add_nodes_edges: (graph, nodes: NodysseusNode[], edges: Edge[], remove_edges: Edge[], remove_nodes: NodysseusNode[], lib: Lib) => {
          const graphId = typeof graph === "string" ? graph : graph.id;
          nodysseus.refs.add_nodes_edges({graphId, addedNodes: nodes, addedEdges: edges, removedEdges: remove_edges, removedNodes: remove_nodes})
          change_graph(
            nodysseus.refs.get(graphId) as Graph, 
            lib, 
            nodes.concat(remove_nodes)
              .map(n => n.id)
              .concat(edges.concat(remove_edges).flatMap(e => [e.to, e.from])));
        },
        delete_node: (graph: Graph, id, lib: Lib, changeEdges=true) => {
          wrapPromise(get_graph(graph)).then(graph => {
            const graphId = typeof graph === "string" ? graph : graph.id;

            const parent_edge = (lib.data ?? lib).no.runtime.get_edge_out(graph, id);
            const child_edges = (lib.data ?? lib).no.runtime.get_edges_in(graph, id);

            const current_child_edges = (lib.data ?? lib).no.runtime.get_edges_in(graph, parent_edge.to);
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


            if(changeEdges === undefined) {
              nodysseus.refs.remove_node(graphId, id)
            } else {
              nodysseus.refs.add_nodes_edges({
                graphId, 
                addedEdges: new_child_edges, 
                removedEdges: child_edges, 
                removedNodes: [graph.nodes[id]]
              })
              change_graph(
                nodysseus.refs.get(graphId) as Graph, 
                lib, 
                current_child_edges.concat(new_child_edges).flatMap(e => [e.to, e.from]));
            }
          })
        },
        addListener,
        addListener_extern: {
          args: ["event", "listener_id", "fn"],
          addListener,
        },
        removeListener,
        pauseGraphListeners,
        isGraphidListened,
        isListened,
        togglePause,
        publish,
        set_parent: (graph, parent) => {
          const graphid = graph;
          const parentid = parent;
          return wrapPromise(nodysseus.parents.get(parentid)).then(parent_parent => {
            const parentest =
              (parent_parent ? parent_parent.parentest : false) || parentid;
            const new_parent = {
              id: graphid,
              parent: parentid,
              parentest,
            };
            nodysseus.parents.set(graphid, new_parent)
          }).value;
        },
        undo: (id: string) => nodysseus.refs.undo && nodysseus.refs.undo(id),
        redo: (id: string) => nodysseus.refs.redo && nodysseus.refs.redo(id),
        store: nodysseus,
        ancestor_graph
      } as const;
    }

type Runtime = ReturnType<typeof runtimefn>;


const nolib: Record<string, any> & {no: {runtime: Runtime} & Record<string, any>} = {
  no: {
    of: <T>(value): Result | Promise<Runnable> => ispromise(value) ? value.then(nolib.no.of) : isValue(value) ? value : { __kind: "result", value: value},
    arg: (node, target: Env, lib: Lib, value, options: RunOptions) => {
      value = node.value;
      if(!value) return;
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
      // let resolveret = (rr) => {
      //   const retrun = isValue(rr) && isConstRunnable(rr.value) && valuetype !== "raw" ? run_runnable(rr, lib, undefined, options) : undefined
      //   return  ispromise(retrun) ? retrun.then(v => isError(v) ? v : v?.value) : retrun ? isValue(retrun) || isWrappedPromise(retrun) ? retrun?.value : retrun : rr;
      // }
      let resolveret = (rr) =>
        wrapPromise(rr)
          .then(rrr => isValue(rrr) ? rrr.value : rrr)
          .then(rrr => isConstRunnable(rrr) && valuetype !== "raw" ? resolveret(run_runnable(rrr, lib, new Map(), options)) : rrr).value
          

        // (console.log("start", rr), ispromise)(rr) 
        // ? rr.then(resolveret)
        // : isValue(rr) && isConstRunnable(rr.value) && valuetype !== "raw"
        // ? resolveret(run_runnable(ret, lib))
        // : (console.log("end", rr), rr)

      return resolveret(ret)
    },
    base_graph,
    base_node,
    nodysseus_get,
    NodysseusError,
    runtime: undefined,
    wrapPromise,
    runtimefn,
  },
  extern: {
    // runGraph: F<A> => A
    ap: {
      rawArgs: true,
      promiseArgs: true,
      args: ["fn", "args", "run", "_lib"],
      fn: (fn, args, run, lib: Lib) => {
        const resolveRunnable = (runnable) => (isRunnable(runnable) && isConstRunnable(runnable) ? 
          wrapPromise(run_runnable(runnable, lib))
            .then(r => resolveRunnable(isValue(r) ? r.value : r)) : wrapPromise(runnable)).then(r => isValue(r) ? r.value : r).value

        const apRunnable = (fnRunnable: ApFunctorLike | Array<ApFunctorLike>, run: boolean): ApRunnable => ({
            __kind: AP,
            fn: Array.isArray(fnRunnable) ? fnRunnable.filter(v => v) : fnRunnable,
            args: args ?? (run ? fn.env : undefined),
            lib
          })

        return wrapPromise(run_runnable(fn, lib))
          .then(fnr => isValue(fnr) ? Array.isArray(fnr.value) ? fnr.value.map(fnrv => resolveRunnable(fnrv)) :  resolveRunnable(fnr) : fnr)
          .then(fnr => !((Array.isArray(fnr) ? fnr : [fnr])
                         .filter(fnrv => fnrv).every(isApFunctorLike)) 
                        ? fnr 
                        : run 
                        ? run_runnable(apRunnable(fnr, run), lib) 
                        : apRunnable(fnr, run))
          .then(res => lib.data.no.of(res)).value
      }
    },
    create_fn: {
      args: ["runnable", "_lib"],
      fn: externs.create_fn
    },
    parseValue: {
      args: ["value"],
      fn: externs.parseValue
    },
    switch: {
      rawArgs: true,
      args: ["input", "args", "_node_args", "_lib", "_runoptions", "otherwise", "removeSubscriptions", "__graphid"],
      fn: (input, args, node_args: Args, lib: Lib, options, otherwise, removeSubscriptions, graphid) => {
        return wrapPromiseAll([
          run_runnable(input, lib, undefined, options), 
          run_runnable(args, lib, undefined, options),
          run_runnable(removeSubscriptions, lib, undefined, options)
        ])
        .then(([inputval, runargs, removeSubscriptions]) => [
          isValue(inputval) ? inputval.value : inputval, 
          (isValue(runargs) ? runargs.value : runargs) ?? node_args,
          isValue(removeSubscriptions) ? removeSubscriptions.value : false
        ])
        .then(([ival, args, removeSubscriptions]) => {
          if(removeSubscriptions && lib.data.no.runtime.get_args(graphid).value !== ival){
              removeSubscriptions && (isArgs(args) ? [...args.entries()] : Object.entries(args))
             .filter(e => !e[0].startsWith("__"))
             .flatMap((runnableEntry: [string, ConstRunnable]) => Object.values(ancestor_graph(runnableEntry[1].fn, lib.data.no.runtime.get_ref(runnableEntry[1].graph), lib).nodes).map(n => [runnableEntry[0], runnableEntry[1].graph, n]))
             .forEach(([inputid, graph, node]: [string, Graph, NodysseusNode]) => lib.data.no.runtime.pauseGraphListeners(`${graph.id}/${node.id}`, ival !== inputid));
             lib.data.no.runtime.update_args(graphid, {value: ival})
          }

          return isError(ival)
            ? ival 
            : run_runnable(
                 isArgs(args) 
                  ? args.get(ival) 
                  : args[ival], 
                lib, undefined, options)
            ?? run_runnable(otherwise, lib, undefined, options)
        })
          .then(res => {
            return res;
          });
      },
    },
    resolve: {
        rawArgs: false,
        args: ['object', '_lib'],
        fn: (object: Args, lib) => {
            return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]));
        }
    },
    map: {
      rawArgs: true,
      args: ["fn", "array", "_lib", "_runoptions"],
      fn: (fn, array, lib, options) =>
        wrapPromise(run_runnable(array, lib, undefined, options))
          .then(arr => isValue(arr) ? arr.value : arr)
          .then(arr => Array.isArray(arr) 
            ? wrapPromise(run_runnable(fn, lib, undefined, options))
              .then(fnr => isError(fnr) ? fnr : fnr.value)
              .then(fnr => isApFunctorLike(fnr)
                   ? wrapPromiseAll(arr.map((element, index) =>
                      typeof fnr === "function" ? (fnr(mergeEnv(new Map([["element", lib.data.no.of(element)], ["index", lib.data.no.of(index)]]), fn.env)) as Result | Promise<Result>)
                      : run_runnable(fnr, lib, new Map([["element", lib.data.no.of(element)], ["index", lib.data.no.of(index)]]), options)
                     ).map(v => wrapPromise(v).then(v => isValue(v) ? v.value : v))).then(vs => lib.data.no.of(vs))
                   : isError(fnr) ? fnr
                   : arr)
            : arr).value
    },
    fold: {
      rawArgs: true,
      args: ["fn", "object", "initial", "_lib", "_runoptions"],
      fn: (fn, object, initial, lib: Lib, options) =>
        wrapPromise(run_runnable(object, lib, undefined, options))
          .then(ov => isError(ov) ? ov : ov.value)
          .then(objectvalue => 
            objectvalue === undefined ? undefined 
            : isError(objectvalue) ? objectvalue
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
                      // lib.data.no.runtime.addListener('grapherror', fnrunnable.graph.id + "/" + fnrunnable.fn, errorlistener)

                      const ret = mapobjarr(
                        objectvalue,
                        (previousValue, currentValue) =>
                          !errored && wrapPromise(previousValue).then(prevVal => {
                            const args = new Map().set("previousValue", lib.data.no.of(prevVal)).set("currentValue", lib.data.no.of(currentValue))
                            return typeof fnrunnable === "function" ? fnrunnable(args) : run_runnable(fnrunnable, lib,
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

                      // lib.data.no.runtime.removeListener('grapherror', fnrunnable.graph.id + "/" + fnrunnable.fn, errorlistener)

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
      args: ["fn", "parameters", "_lib", "_runoptions"],
      fn: createFunctorRunnable
    },
    expect: {
      args: ["a", "b", "__graph_value"],
      fn: externs.expect
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
    refval: {
      rawArgs: true,
      outputs: {
        display: true
      },
      args: ["onframe", "_lib", "__graphid", "_runoptions", "_output", "initial", "publish"],
      fn: (onframe, lib, graphid, options, output, initial, publish) => {
        const args = lib.data.no.runtime.get_args(graphid);

        let store = args["store"] ?? {
          __kind: "refval",
          graphid,
          set: {
            __kind: "apFunction",
            fn: (value) => {
              if(store["publish"]) {
                lib.data.no.runtime.publish("argsupdate", {graphid, changes: [['store.value', value]], mutate: true}, lib, options)
              } else {
                store["value"] = value;
              }
              return value;
            },
            args: ['value'],
          },
          publish: wrapPromise(run_runnable(publish, lib, undefined, options))
            .then(p => isValue(p) ? p.value : p)
            .then(p => {
              const args = lib.data.no.runtime.get_args(graphid)["store"]
              if(args) {
                args["publish"] = p;
              }
              return p
            }).value,
          value: undefined
        }

        if(!args["store"]) {
          lib.data.no.runtime.update_args(graphid, {store}, lib)
          if(initial) {
            return wrapPromise(run_runnable(initial, lib, undefined, options))
              .then(res => isValue(res) ? res.value : res)
              .then(value => {
                store.value = value
                return store;
              }).value
          }
        }

        return output === "display" ? {dom_type: 'div', props: {}, children: [{dom_type: "text_value", text: JSON.stringify(store.value)}]} : store
      }
    },
    state: {
      rawArgs: true,
      outputs: {
        display: true
      },
      args: ["value", "_lib", "__graphid", "_runoptions", "_output", "persist", "publish"],
      fn: (value, lib, graphid, options, output, persist, publish) => {
        let rawstate = lib.data.no.runtime.get_args(graphid)["state"]

        return wrapPromise(publish && run_runnable(publish, lib, undefined, options))
          .then(publish => isValue(publish) ? publish.value : publish)
          .then(publish =>
            wrapPromise(persist && run_runnable(persist, lib, undefined, options))
              .then(persist => isValue(persist) ? persist.value : persist)
              .then(persist => ({publish, persist})).value)
          .then(rawstate !== undefined ? (v => v) : ({publish, persist}) => {
            const persistedState = persist && rawstate === undefined && nodysseus.persist.get(graphid);
            const initialState = wrapPromise(persistedState)
              .then(ps => ps ? JSON.parse(ps)
               : value && (rawstate === undefined || rawstate === null)
               ? wrapPromise(run_runnable(value, lib, undefined, options))
                  .then(result => isValue(result) ? result.value : result)
              : undefined);
            return initialState ? initialState
              .then(initial => {
                if(publish) {
                  lib.data.no.runtime.publish("argsupdate", {graphid, changes: {state: initial}, mutate: false}, lib, options, true)
                } else {
                  lib.data.no.runtime.update_args(graphid, {state: initial})
                }

                return initial
              }).then(initial => ({publish, persist, initial})).value 
              : {publish, persist}
          })
          .then(({persist, publish, initial}: {persist, publish, initial?}) => 
            wrapPromise(rawstate)
              .then(rawstate => isValue(rawstate) ? rawstate.value : rawstate)
              .then(state => ({publish, persist, state: state ?? initial})).value)
          .then(({persist, publish, state}) => output === "display" 
            ? lib.data.no.of({dom_type: 'div', props: {}, children: [{dom_type: 'text_value', text: JSON.stringify(state)}]}) 
            : ({
              __kind: "state",
              graphid,
              set: {
                __kind: "apFunction",
                promiseArgs: true,
                fn: (value) => {
                  const result = value === undefined || value === null ? undefined : run_runnable(value, lib, undefined, {resolvePromises: false});
                  const promiseresult = ispromise(result) ? result.then(r => isValue(r) ? r.value : r) : isValue(result) ? result.value : result;
                  const isresultpromise = ispromise(promiseresult);

                  if(publish) {
                    lib.data.no.runtime.publish("argsupdate", {graphid, changes: {state: promiseresult}, mutate: false}, lib, options, true)
                  } else {
                    lib.data.no.runtime.update_args(graphid, {state: promiseresult}, lib)
                  }

                  if(!isresultpromise && persist) {
                    nodysseus.persist.set(graphid, JSON.stringify(promiseresult))
                  }

                  return isresultpromise ? promiseresult.then(pr => {
                    if(persist) {
                      nodysseus.persist.set(graphid, JSON.stringify(pr))
                    }
                    if(publish) {
                      lib.data.no.runtime.publish("argsupdate", {graphid, changes: {state: pr}, mutate: false}, lib, options, true)
                    } else {
                      lib.data.no.runtime.update_args(graphid, {state: pr}, lib)
                    }
                    return pr;
                  }) : promiseresult;
                },
                args: ['value']
              },
              state,
            })).value
      }
    },
    unwrapValue: {
      args: ["value"],
      fn: (value) => value?.__kind === "state" ? value.state : value?.__kind === "refval" ? value.value : value
    },
    return: {
      outputs: {
        display: true,
        lib: true,
        metadata: true
      },
      resolve: false,
      rawArgs: true,
      promiseArgs: true,
      args: [
        "value",
        "display",
        "subscribe",
        "metadata",
        "args",
        "lib",
        "_graph_input_value",
        "_lib",
        "_runoptions",
        "__graphid"
      ],
      fn: (
        value,
        display,
        subscribe,
        metadata,
        argsfn,
        lib,
        _args,
        _lib: Lib,
        options,
        graphid
      ) => {
        const output = _args._output;
        const edgemap = { value, display, subscribe, metadata, lib };

        if((output === "display" || output === "metadata" || output === "parameters") && !edgemap[output]) {
          return;
        }

        const runedge = output && output === display ? display : edgemap[output] ? output : "value";

        // _lib.data.no.runtime.removeAncestorListeners(graphid)

        const return_result = (_lib: Lib, args: Args) => {
          args = args && !isArgs(args) ? new Map(Object.entries(args)) : args;
          const runnable = edgemap[runedge] ? edgemap[runedge] : runedge === "value" && !value && display ? display : _lib.data.no.of(undefined);
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

            // if(_lib.data.no.runtime.isGraphidListened(graphid)) {
            //   console.log(`canceled subscribe-${graphid}`, _lib.data.no.runtime.isGraphidListened(graphid));
            // }
          if (edgemap.subscribe && (runedge === "display" || runedge === "value")) {
            // console.log(`subscribing for ${graphid}`)
            // const graphid = (subscribe.env.data.get("__graphid") as {value: string}).value;
            // const newgraphid = graphid + "/" + _node.id;
            const newgraphid = graphid;

            wrapPromise(run_runnable(
              edgemap.subscribe,
              _lib,
              args,
              {...options, resolvePromises: true}
            ))
            .then(subscriptions => isValue(subscriptions) ? subscriptions.value : subscriptions)
            .then(subscriptions => subscriptions && Object.entries(subscriptions)
                .forEach(kv => kv[1] &&
                  !_lib.data.no.runtime.isListened(kv[0], newgraphid) 
                  && _lib.data.no.runtime.addListener(kv[0], newgraphid, kv[1], false, 
                    graphid, true, _lib, options)))
          }

          return runedgeresult;
        }

        const ret = wrapPromise(run_runnable(lib, _lib, undefined, {...options, resolvePromises: true}))
            .then(libr => isError(libr) ? libr : libr?.value)
            .then(libr => (libr && `${lib.graph.id}/${lib.graph.out ?? "out"}` === graphid && nodysseus.state.set(`${lib.graph.id}-lib`, libr), libr))
            .then(libr => wrapPromise(argsfn ? run_runnable({
                ...argsfn,
                lib: mergeLib(libr, _lib)
              }, _lib, undefined, {...options, isNoResolve: true, resolvePromises: true}) : undefined)
              .then(args => return_result(mergeLib(libr, _lib), isValue(args) ? args?.value : args))).value
        return ret;
      },
    },
    compare: {
      args: ["_node_args"],
      fn: (args) => compare(args[0], args[1])
    },
    eq: {
      args: ["_node_args"],
      fn: (args: Array<any>) => args.every(v => v === args[0])
    },
    get: {
      outputs: {
        metadata: true
      },
      args: {"target": {type: "any", default: true}, "path": "any", "def": "any", "__graph_value": "system", "_lib": "system", "_output": "system"},
      fn: ({target, path, def, __graph_value, _lib, _output}) => {
        const getPrototypeNames = (obj) => 
          obj && typeof obj === "object" && Object.getPrototypeOf(obj) ? Object.getOwnPropertyNames(obj)
            .concat(getPrototypeNames(Object.getPrototypeOf(obj)))
            : [];
        if(_output === "metadata") {
          return {
            values: getPrototypeNames(target)
          }
        }
        const _path = __graph_value || path;
        console.log(target, _path);
        return _path ? _lib.data.no.nodysseus_get(
          _path.startsWith("lib") ? _lib.data : target,
          _path.startsWith("lib") ? _path.substring(3) : _path,
          _lib, 
          def
        ) : target;
      },
    },
    set: {
      args: ["target: default", "path", "value", "__graph_value"],
      fn: (target, path, value, nodevalue) => {
        const ispromise = <T>(a: any): a is Promise<T> => a && typeof a.then === 'function' && !isWrappedPromise(a);
        const keys = (nodevalue || path).split(".");
        const check = (o, v, k) =>
          k.length === 1
            ? { ...o, [k[0]]: v }
            : o && typeof o === "object" && Object.hasOwn(o, k[0])
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
        function set(obj, propsArg, value) {
          var props, lastProp;
          if (Array.isArray(propsArg)) {
            props = propsArg.slice(0);
          }
          if (typeof propsArg == 'string') {
            props = propsArg.split('.');
          }
          if (typeof propsArg == 'symbol') {
            props = [propsArg];
          }
          if (!Array.isArray(props)) {
            throw new Error('props arg must be an array, a string or a symbol');
          }
          lastProp = props.pop();
          if (!lastProp) {
            return false;
          }
          var thisProp;
          while ((thisProp = props.shift())) {
            if (typeof obj[thisProp] == 'undefined') {
              obj[thisProp] = {};
            }
            obj = obj[thisProp];
            if (!obj || typeof obj != 'object') {
              return false;
            }
          }
          obj[lastProp] = value;
          return true;
        }
        if(target && (nodevalue || path)) {
          set(target, nodevalue || path, value);
        }
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
      args: ["_node", "_node_args", "_graph", "_lib", "_runoptions", "_output"],
      fn: (node, node_inputs, graph, _lib, options, _output) =>
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
      args: ["url", "__graph_value", "_lib"],
      fn: (url, graphvalue, lib) => {
        const urlval = url || graphvalue;
        if(!urlval) return;
        const stateid = `__jsimport:${urlval}`;
        const existing = nodysseus.state.get(stateid);
        if(existing) return existing;
        const promise = import(urlval).then(jsmodule => (nodysseus.state.set(stateid, jsmodule), jsmodule));
        nodysseus.state.set(stateid, promise);
        return promise;
      }
    },
    update_args: {
      promiseArgs: true,
      args: ["path", "value", "__graphid", "_lib"],
      resolve: false,
      fn: (path, value, graphid, lib) => {
        const pathresult = run_runnable(path, lib) as Result;
        path = isValue(pathresult) ? pathresult.value : pathresult;
        const result = value === undefined || value === null ? undefined : run_runnable(value, lib);

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
      outputs: {
        metadata: true
      },
      args: {"__graph_value": "system", "self": {type: "any", default: true}, "fn": "value", "args": "@data.array", "_lib": "lib", "_output": "system"},
      fn: ({__graph_value, self, fn, args, _lib, _output}) => {
        const getPrototypeChainMethods = (obj) => 
          obj && typeof obj === "object" && Object.getPrototypeOf(obj) ? Object.getOwnPropertyNames(obj)
            .filter(n => typeof obj[n] === "function")
            .concat(getPrototypeChainMethods(Object.getPrototypeOf(obj)))
            : [];
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
            const ng_self = (fn || nodevalue)?.includes('.') 
              ? nodysseus_get(self, (fn || nodevalue).substring(0, (fn || nodevalue).lastIndexOf('.')), _lib) 
              : self;
            const parameters = typeof ng_fn === "function" ? nolib.extern.functionParameters.fn(ng_fn) : []
            if (_output === "metadata"){
              return {
                values: self && typeof self === "object" ? getPrototypeChainMethods(self) : [],
                parameters
              }
            }
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
              : typeof ng_fn === "function"
              ? ng_fn.apply(ng_self, fnargs)
              : ng_self);
              return ret;
          }
        }

        return ispromise(args) ? args.then(runfn) : runfn(args);
      },
    },
    merge_objects_mutable: {
      args: ["target", "_node_args", "_lib", "_runoptions"],
      fn: (target, args, lib, options) => {
        const keys = Object.keys(args).filter(k => k !== "target").sort();
        return wrapPromiseAll(keys.map(k => [k, isRunnable(args[k]) ? run_runnable(args[k], lib) : args[k]]))
          .then(inputs => wrapPromiseAll(inputs
                  .map(kv => [kv[0], isValue(kv[1]) ? kv[1].value : kv[1]])
                  .map(kv => [kv[0], isArgs(kv[1]) ? resolve_args(kv[1], lib, options) : kv[1]]))
                .then(kvs => Object.fromEntries(kvs.map(kv => [kv[0], isValue(kv[1]) ? kv[1].value : kv[1]]))).value
           )
          .then(resolved =>
              Object.assign(
                  target,
                  ...keys
                    .map((k) => resolved[k])
                    .map(a => isArgs(a) ? Object.fromEntries(a.entries()) : a)
                    .filter((a) => a && typeof a === "object")
                )
           ).value
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
      fn: externs.now
    },
    math: {
      args: ["__graph_value", "_node_args"],
      resolve: true,
      fn: (graph_value, args) => Math[graph_value](...Object.entries(args).filter(kv => kv[0] !== "__graph_value").sort((a, b) => a[0].localeCompare(b[0])).map(kv => kv[1]))
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
    convertAngle: {
      args: ["degrees", "radians"],
      fn: (degrees, radians) => {
        if(degrees && radians) {
          throw new Error("Got both degrees and radians!")
        }

        return degrees ? degrees * Math.PI / 180 : radians * 180 / Math.PI;
      }
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
            : o && typeof o === "object" && Object.hasOwn(o, k[0])
            ? {
                ...o,
                [k[0]]: check(o[k[0]], fn, k.slice(1)),
                _needsresolve: true,
              }
            : o;
        return check(target, fn, keys);
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
      args: {"args": "@data.array", "name": "any", "__graph_value": "system", "_lib": "system"},
      fn: ({args, name, nodevalue, _lib}) => {
        const fn = nodysseus_get(_lib.data, name || nodevalue, _lib, typeof window !== "undefined" ? window[nodevalue] : self[nodevalue]);
        return fn && typeof fn === "function" && new (Function.prototype.bind.apply(
          fn,
          [null, ...(args === undefined ? [] : Array.isArray(args) ? args : [args])])
        )
      }
    },
    addEventListeners: {
      args: ["target", "_node_args", "_lib"],
      fn: (target, nodeargs, lib: Lib) => {
        Object.entries(nodeargs)
        .filter(kv => kv[0] !== "target")
        .forEach(([k, fn]: [string, Runnable]) => target[k] = event => fn && run_runnable(fn, lib, new Map().set("event", event)))
        return target;
      }
    },
    functionParameters: {
      args:["fn"],
      fn: (fn) => {
        const fnstring = fn.toString();
        // hacky: return the first set of parameters we find
        let foundParams = false, pastParams = false;
        const args = [];
        parser.parse(fnstring).iterate({
          enter: syntaxNode => {
            if(!pastParams && syntaxNode.matchContext(["ParamList"]) && syntaxNode.name === "VariableDefinition" && !syntaxNode.matchContext(["Arrow"])) {
              foundParams = true;
              args.push(fnstring.substring(syntaxNode.from, syntaxNode.to))
            } else if (!pastParams && foundParams && !syntaxNode.matchContext(["ParamList"])) {
              pastParams = true;
            }
          }
        })
        return args;
      }
    }
  } as Record<string, Extern>,
  // THREE
};

const nolibLib = newLib(nolib);

export {nolib, nolibLib, initStore, compare, hashcode, ispromise, NodysseusError, resfetch, resolve_args };



