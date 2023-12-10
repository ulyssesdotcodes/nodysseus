import { ancestor_graph, ispromise, isWrappedPromise, wrapPromise, wrapPromiseAll, base_graph, base_node, compareObjects, descendantGraph, handleError, NodysseusError } from "./util.js"
import { isNodeGraph, Graph, NodysseusNode, NodysseusStore, Store, Result, Runnable, isValue, isNodeRef, RefNode, Edge, isApRunnable, ApRunnable, FunctorRunnable, isConstRunnable, ConstRunnable, isRunnable, InputRunnable, Lib, Env, isEnv, Args, isArgs, ResolvedArgs, RunOptions, isError, FUNCTOR, CONST, AP, TypedArg, ApFunctorLike, ApFunction, isApFunction, isApFunctorLike, Extern, getRunnableGraph, ValueNode, isLib, isFunctorRunnable, isGraph, isInputRunnable, MemoryState, MemoryReference, isMemory, isResult, NodeMetadata, NonErrorResult } from "./types.js"
import { combineEnv,  newLib, newEnv, mergeEnv, mergeLib, } from "./util.js"
import generic from "./generic.js"
import * as externs from "./externs.js"
import { initListeners } from "./events.js"
import { objectRefStore } from "./editor/store.js"
import { parser } from "@lezer/javascript"

const generic_nodes = generic.nodes

export const mapStore = <T>(): Store<T> => {
  const map = new Map<string, T>()

  return {
    get: id => map.get(id),
    set: (id, data: T) => (map.set(id, data), data),
    delete: id => map.delete(id),
    clear: () => map.clear(),
    keys: () => [...map.keys()]
  }
}


let nodysseus: NodysseusStore

const resfetch = typeof fetch !== "undefined" ? fetch : 
  (urlstr, params?) => import("node:https").then(https => new Promise<string | Response>((resolve) => {
    const url = new URL(urlstr)
    const req = https.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: params.headers,
      method: params.method.toUpperCase()
    }, async response => {
      const buffer = []
      for await(const chunk of response) {
        buffer.push(chunk)
      }
      const data = Buffer.concat(buffer).toString()
      resolve(data)
    })
    if(params.body) {
      req.write(params.body)
    }
    req.end()
  }))


export const nodysseus_get = (obj: Record<string, any> | Args | Env, propsArg: string, lib: Lib, defaultValue=undefined, props: Array<string>=[], options: RunOptions = {}) => {
  const objArg = obj
  obj = isEnv(obj) ? obj.data : obj
  if (!obj) {
    return defaultValue
  }
  const naive = isArgs(obj) ? obj.get(propsArg) : obj[propsArg]
  if(naive !== undefined) {
    return naive
  }

  let prop
  if (props.length === 0) {
    if(typeof propsArg == "string") {
      if(propsArg.includes(".")){
        props = propsArg.split(".")
      } else {
        props.push(propsArg)
      }
    }
    if (typeof propsArg == "symbol" || typeof propsArg === "number") {
      props.push(propsArg)
    }
  }

  if (!Array.isArray(props)) {
    throw new Error("props arg must be an array, a string or a symbol")
  }

  while (props.length) {
    if(obj && isRunnable(obj)) {
      const ran = run_runnable(obj, lib, undefined, options)
      if(ispromise(ran)) {
        obj = ran
        continue
      } else if (isValue(ran)) {
        obj = ran.value
        continue
      }
    }

    if(obj && ispromise(obj)){
      return obj.then(r => props.length > 0 ? nodysseus_get(r, propsArg, lib, defaultValue, props) : r)
    }

    prop = props[0]
    if((obj === undefined || typeof obj !== "object" || 
        !(isArgs(obj) ? obj.has(prop) : obj[prop] !== undefined || (obj.hasOwnProperty && Object.hasOwn(obj, prop))))){
      return isEnv(objArg) ? nodysseus_get(objArg.env, propsArg, lib, defaultValue, props) : defaultValue
    }

    props.shift()

    obj = isArgs(obj) ? obj.get(prop) : obj[prop]

    if(obj && ispromise(obj)){
      return obj.then(r => props.length > 0 ? nodysseus_get(r, propsArg, lib, defaultValue, props) : r)
    }
  }
  return obj
}


function compare(value1, value2) {
  if (value1 === value2) {
    return true
  }
  /* eslint-disable no-self-compare */
  // if both values are NaNs return true
  if (value1 !== value1 && value2 !== value2) {
    return true
  }
  if(!!value1 !== !!value2){
    return false
  }
  if (typeof value1 !== typeof value2) {
    return false
  }
  if(typeof value1 === "function" || typeof value2 === "function") {
    // no way to know if context of the functions has changed
    return false
  }
  if (Array.isArray(value1)) {
    return compareArrays(value1, value2)
  }
  if (typeof value1 === "object" && typeof value2 === "object") {
    if(value1.fn && value1.fn === value2.fn 
            && compare(value1.graph, value2.graph)
            && compare(value1.args, value2.args)) {
      return true
    }
    if ((value1 instanceof Map) && (value2 instanceof Map)) {
      return compareArrays([...value1.entries()], [...value2.entries()])
    }
    if ((value1 instanceof Set) && (value2 instanceof Set)) {
      return compareArrays(Array.from(value1), Array.from(value2))
    }

    return compareObjects(value1, value2)
  }


  return compareNativeSubrefs(value1, value2)
}

function compareNativeSubrefs(value1, value2) {
  // e.g. Function, RegExp, Date
  return value1.toString() === value2.toString()
}

function compareArrays(value1, value2) {
  const len = value1.length
  if (len != value2.length) {
    return false
  }
  let alike = true
  for (let i = 0; i < len; i++) {
    if (!compare(value1[i], value2[i])) {
      alike = false
      break
    }
  }
  return alike
}


const hashcode = function (str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
  let i = str.length, ch
  while (i > 0) {
    i--
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export const node_value = (node: ValueNode | RefNode) => externs.parseValue(node.value)
const node_nodes = (node: string | Graph, node_id: string, data, graph_input_value: Env, lib: Lib, options: RunOptions) => {
  return wrapPromise(typeof node === "string" ? nolib.no.runtime.get_ref(node) : node).then(graph => run_graph(graph, node_id, combineEnv(data, graph_input_value, node_id, graph_input_value._output), lib, options)).value
}

const node_script = (node: RefNode, nodeArgs: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const orderedargs = ["", ...nodeArgs.keys()].join(", ")

  // const data = {};
  const data = resolve_args(nodeArgs, lib, options.resolvePromises ? options : {...options, resolvePromises: true})
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

  const name = node.name ? node.name.replace(/\W/g, "_") : node.id
  const fn = lib.data.no.runtime.get_fn(node.id, name, orderedargs, node.value)

  return wrapPromise(data)//wrapPromiseAll(Object.values(data))
    .then(promisedData => lib.data.no.of(fn.apply(null, [lib.data, node, data, ...Object.values(isError(promisedData) ? promisedData : promisedData?.value ?? {})]))).value
}

export const run_extern = (extern: ApFunction, data: Args, lib: Lib, options: RunOptions, node?: NodysseusNode, graphArgs?: Env) => {
  if(graphArgs?._output && graphArgs._output !== "value" && !extern.outputs?.[graphArgs._output]) {
    return undefined
  }

  let argColonIdx
  let argspromise = false
  const isArgsArray = Array.isArray(extern.args)
  const externArgs: Array<[string, TypedArg]>  = isArgsArray ? extern.args.map(a => {
    argColonIdx = a.indexOf(":")
    return [argColonIdx >= 0 ? a.substring(0, argColonIdx) : a, "any"]
  }) : Object.entries(extern.args)
  const args = typeof extern === "function" ?  resolve_args(data, lib, options) :  externArgs.map(([arg]) => {
    let newval
    if (arg === "_node") {
      newval = node 
    } else if (arg === "_node_args") {
      newval = extern.rawArgs ? data : resolve_args(data, lib, options)
      newval = ispromise(newval) ? newval.then((v: Result | undefined) => isError(v) ? v : v?.value)  : extern.rawArgs ? newval : newval.value
    } else if (arg === "_args") {
      newval = extern.rawArgs ? data : wrapPromise(resolve_args(data, lib, options)).then(data => isError(data) ? data : data.value).then(args => new Map(Object.entries(args))).value
    } else if (arg == "_lib") {
      newval = lib
    } else if (arg == "_graph_input_value") {
      newval = graphArgs
    } else if (arg == "_runoptions") {
      newval = options
    } else if (arg == "__graphid") {
      newval = (graphArgs.data.get("__graphid") as {value: string}).value
    } else if (arg == "_output") {
      newval = graphArgs._output
    } else {
      newval = extern.rawArgs ? data.get(arg) : run_runnable(data.get(arg), lib, new Map(), options)
      while(isConstRunnable(newval) && !extern.rawArgs) {
        newval = run_runnable(newval, lib, new Map(), options)
      }
      newval = ispromise(newval) ? newval.then((v: Result) => isError(v) ? v : v?.value) : newval && !extern.rawArgs ? newval.value : newval
    }

    argspromise ||= ispromise(newval)
    return newval
  })

  argspromise ||= ispromise(args)

  if (argspromise && !extern.promiseArgs) {
    return (Array.isArray(args) ? Promise.all(args) : (args as Promise<Result>).then(v => isValue(v) ? v.value.args : v)).then(as => {
      const res = (typeof extern === "function" ? extern :  extern.fn)(...(isArgsArray ? as : [Object.fromEntries(externArgs.map((a, idx) => [a[0], as[idx]]))]))
      return wrapPromise(res).then(res => extern.rawArgs ? res : lib.data.no.of(res)).value
    })
  } else if(!ispromise(args)) {
    const resArgs = Array.isArray(args) ? args : isValue(args) ? args.value.args : args
    const res = (typeof extern === "function" ? extern :  extern.fn)(...(isArgsArray ? resArgs : [Object.fromEntries(externArgs.map((a, idx) => [a[0], resArgs[idx]]))]))
    return wrapPromise(res).then(res => extern.rawArgs ? res : lib.data.no.of(res)).value
  }

}

export const node_extern = (node: RefNode, data: Args, graphArgs: Env, lib: Lib, options: RunOptions) => {
  const libExternFn = node.value.startsWith("extern.") && node.value.substring(7)
  return run_extern(libExternFn ? lib.data.extern[libExternFn] : nodysseus_get(lib.data, node.value, lib), data, lib, options, node, graphArgs)
}

const resolve_args = (data: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  let is_promise = false
  const result = {}
  for(const k of data.keys()){
    let val: Result | ConstRunnable | Promise<Result> = data.get(k)
    const resarg = (argval) => wrapPromise(isValue(argval) ? argval.value : argval).then(runnable => isConstRunnable(runnable) ? resarg(run_runnable(runnable, lib, undefined, options)) : runnable).value
    val = resarg(val)
    // while(isConstRunnable(val as Runnable)) {
    //   val = wrapPromise(val).then(runnable => run_runnable(runnable, lib, undefined, options)).value;
    // }

    if(val instanceof Error) {
      return val
    }
    is_promise = is_promise || !!val && ispromise(val)
    result[k] = val
  }

  if (is_promise && options.resolvePromises) {
    const promises = []
    Object.entries(result).forEach(kv => {
      promises.push(Promise.resolve(kv[1]).then((pv: Result) => isError(pv) ? pv : [kv[0], isValue(pv) ? pv?.value : pv]))
    })
    return Promise.all(promises).then(Object.fromEntries).then(v => lib.data.no.of(v))
  }

  // if(!options.resolvePromises && is_promise) {
  //   debugger;
  // }
  for(const k of Object.keys(result)) {
    if(k.startsWith("__")){
      delete result[k]
    } else if(isValue(result[k])) {
      result[k] = result[k].value
    }
  }

  return lib.data.no.of(result)

}

const node_data = (nodeArgs, graphArgs: Env, lib, options) => {
  return nodeArgs.size === 0 || graphArgs._output === "display" ? lib.data.no.of(undefined) : resolve_args(nodeArgs, lib, options)
}

const createFunctorRunnable = (fn: Exclude<Runnable, Result | ApRunnable>, parameters: ConstRunnable, lib, options: RunOptions, output: ConstRunnable, includeFullGraph: boolean = false): FunctorRunnable | Promise<FunctorRunnable> => 
  fn && wrapPromiseAll([
    parameters && run_runnable(parameters, lib, undefined, options),
    nolib.no.runtime.refs(),
    output && run_runnable(output, lib, undefined, options)
  ])
    .then(([args, refs, output]: [Result, Array<string>, string]) => isError(args) ? args : lib.data.no.of({
      __kind: FUNCTOR,
      parameters: args ? [...new Set(args.value ? Object.keys(args.value).map(k => k.includes(".") ? k.substring(0, k.indexOf(".")) : k) : [])] : [],
      env: mergeEnv(new Map([["_output", lib.data.no.of(output)]]), fn.env),
      graph:  
        includeFullGraph && typeof fn.graph === "string" 
          ? lib.data.no.runtime.get_ref(fn.graph)
          : typeof fn.graph === "string" 
            ? fn.graph 
            : refs.includes(fn.graph.id) 
              ? fn.graph.id 
              : fn.graph,
      fn: fn.fn,
      lib: fn.lib
    })).value

const createGraphFunctorRunnable = (graph: ConstRunnable, parameters: ConstRunnable, lib: Lib, options: RunOptions, output: ConstRunnable, graphid: ConstRunnable, env: ConstRunnable, out: ConstRunnable): FunctorRunnable | Promise<FunctorRunnable> => 
  graph && wrapPromiseAll([
    parameters && run_runnable(parameters, lib, undefined, options),
    graph && run_runnable(graph, lib, undefined, options),
    output && run_runnable(output, lib, undefined, options),
    graphid && run_runnable(graphid, lib, undefined, options),
    env && run_runnable(env, lib, undefined, options),
    out && run_runnable(out, lib, undefined, options),
  ]).then<FunctorRunnable>(([params, resultGraph, resultOutput, graphid, env, out]: [Result, Result, Result, Result, Result, Result]) => isError(params) 
    ? params 
    : isError(resultGraph) || !resultGraph.value
      ? resultGraph
      : isError(resultOutput)
        ? resultOutput
        : isError(graphid)
          ? graphid
          : isError(env)
            ? env
            : isError(out)
              ? out
              : lib.data.no.of({
                __kind: FUNCTOR,
                parameters: params ? [...new Set(params.value ? Object.keys(params.value).map(k => k.includes(".") ? k.substring(0, k.indexOf(".")) : k): [])] : [],
                env: env && !isError(env) ? mergeEnv(
                  env.value,
                  newEnv(new Map([["__graphid", (graphid && !isError(graphid) && lib.data.no.of(graphid.value)) || lib.data.no.of(resultGraph.value)]]), resultOutput.value),
                ) : newEnv(new Map([["__graphid", (graphid && !isError(graphid) && lib.data.no.of(graphid.value)) || lib.data.no.of(resultGraph.value)]]), resultOutput.value) ,
                graph: resultGraph.value,
                fn: out.value ?? resultGraph.value.out ?? "out",
                lib
              })).value

const run_runnable = (runnable: Runnable | undefined, lib: Lib, args: Map<string, any> = new Map(), options: RunOptions = {}): Result | Promise<Result> | undefined =>  {
  if(runnable === undefined || isError(runnable)) {
    return runnable as Result
  }

  switch (runnable.__kind) {
  case CONST:
    return wrapPromise(getRunnableGraph(runnable, lib))
      .then(graph =>
        wrapPromise(
          run_graph(graph, runnable.fn, mergeEnv(args, runnable.env), runnable.lib, options), 
          e => handleError(e, lib, runnable.graph, runnable.fn, (runnable.env.data.get("__graphid") as NonErrorResult).value)).value).value
  case AP:
    return run_ap_runnable(runnable, args, lib, options)
  case FUNCTOR:
    return wrapPromise(
      run_functor_runnable(runnable, args, lib, options),
      e => handleError(e, lib, runnable.env, runnable.graph, runnable.fn)
    ).value
  }

  return runnable
}


// graph, node, symtable, parent symtable, lib
const run_node = (node: {node: NodysseusNode, graph?: Graph} | Runnable, nodeArgs: Map<string, ConstRunnable>, graphArgs: Env, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  if (isRunnable(node)){
    if(isError(node)) {
      return node
    } else if(isValue(node)) {
      return node
    } else if (isApRunnable(node)) {
      throw new Error("Unexpected node")
    } else {
      const graphid = (graphArgs.data.get("__graphid") as {value: string}).value
      const nodegraphargs: Env = node.env ?? newEnv(new Map(), graphArgs._output)
      nodegraphargs.data.set("__graphid", graphid ?? lib.data.no.of(node.graph))
      lib = mergeLib(node.lib, lib)

      return node_nodes(node.graph, node.fn, nodeArgs, nodegraphargs, lib, options)
    }
  } else if(isNodeRef(node.node)) {
    if (node.node.ref === "arg") {
      if(graphArgs._output === "metadata") {
        const keys = ["__graph_value"]
        const edgeChain = []
        const descGraph = descendantGraph(node.node.id, node.graph, (nodeId, edge) => {
          edgeChain.push(edge)
          const outEdgeChain = [...edgeChain]
          outEdgeChain.reverse()
          const descNode = node.graph.nodes[nodeId]
          const dataNode = nodeId && isNodeRef(descNode) && descNode.ref === "return" && edge.as !== "lib" && edge.as !== "args"
            ? node.graph.nodes[Object.values(node.graph.edges_in[nodeId]).find(e => e.as === "args")?.from]
            : nodeId && isNodeRef(descNode) && descNode.ref === "@flow.runnable"
              ? node.graph.nodes[Object.values(node.graph.edges_in[nodeId]).find(e => e.as === "parameters")?.from]
              : false

          if(dataNode) {
            if (node.graph.edges_in[dataNode.id] && !(isNodeRef(dataNode) && dataNode.value === undefined) || (isNodeRef(dataNode) && ((dataNode.ref === "extern" && dataNode.value === "extern.data") || dataNode.ref === "@data.object"))) {
              Object.values(node.graph.edges_in[dataNode.id]).map(e => e.as).forEach(k => keys.push(k))

            }
          }
          return outEdgeChain
        })
            
        return wrapPromiseAll(
          Object.entries(descGraph)
            .filter(e => e[1])
            .map(e => wrapPromise(run({graph: node.graph.id, fn: e[0], lib, args: newEnv(new Map([["output", lib.data.no.of("metadata")]]))}, graphArgs))
              .then(r => ({nodeId: e[0], inEdge: e[1], metadata: r})).value)
        ).then(descgraphmetas => descgraphmetas.map(dgm => 
          dgm.inEdge.slice(1).reduce((acc, e) => !acc || Array.isArray(acc) ? acc : acc.type === "@flow.runnable" ? acc.runnableParameters : typeof acc.type === "object" ? acc.type[e.as] : acc, dgm.metadata?.parameters?.[dgm.inEdge[0].as])
        ).flat().filter(v => v))
          .then(v => lib.data.no.of({ values: keys.concat(v) }))
          .value
      }
      const resval = nolib.no.arg(node.node, graphArgs, lib, node.node.value, options)
      // return resval && typeof resval === 'object' && isValue(resval) ? resval : lib.data.no.of(resval);
      return wrapPromise(resval).then(resval => resval && typeof resval === "object" && isValue(resval) ? resval : lib.data.no.of(resval)).value
    } else if (node.node.ref === "extern") {
      return node_extern(node.node, nodeArgs, graphArgs, lib, options)
    } else if (node.node.ref === "@js.script") {
      return (graphArgs._output === undefined || graphArgs._output === "value") 
        ? node_script(node.node, nodeArgs, lib, options) 
        : graphArgs._output === "metadata" 
          ? lib.data.no.of({dataLabel: "script", codeEditor: {language: "javascript", editorText: node.node.value}} as NodeMetadata)
          : undefined
    }

    const graphid = (graphArgs.data.get("__graphid") as {value: string}).value
    const newgraphid = `${graphid}/${node.node.id}`
    const newGraphArgs = newEnv(new Map().set("__graphid", lib.data.no.of(newgraphid)), graphArgs._output)

    return wrapPromise(lib.data.no.runtime.get_ref(node.node.ref), e => handleError(e, lib, graphArgs, graphid, node)).then(node_ref => {
      if (!node_ref) {
        throw new Error(`Unable to find ref ${(node.node as RefNode).ref} for node ${node.node.name || node.node.id}`)
      }

      // before so that change/update has the parent id
      // change both nodes with nested graphs and non-
      lib.data.no.runtime.set_parent(newgraphid, graphid, (node.node as RefNode).ref) 

      const result = run_node({node: node_ref}, (node.node as RefNode).value ? new Map(nodeArgs).set("__graph_value", lib.data.no.of((node.node as RefNode).value)) : nodeArgs, newGraphArgs, lib, options)
      return result


    }).value
  } else if (isNodeGraph(node.node)) {
    node.node.edges_in = node.node.edges_in ?? Object.values(node.node.edges).reduce<Graph["edges_in"]>((acc, e) => ({...acc, [e.to]: {...(acc[e.to] ?? {}), [e.from]: e}}), {})
    const graphid = graphArgs.data.get("__graphid")
    // const env = isError(graphid) || isConstRunnable(graphid) ? graphArgs : combineEnv(new Map([["__graphid", lib.data.no.of(`${graphid.value}/${node.id}`)]]), graphArgs, undefined, graphArgs._output);
    const env = isError(graphid) || isConstRunnable(graphid) ? graphArgs : combineEnv(new Map([["__graphid", lib.data.no.of(`${graphid.value}`)]]), graphArgs, undefined, graphArgs._output)
    return node_nodes(node.node, node.node.out ?? "out", nodeArgs, env, lib, options)
  } else if(Object.hasOwn(node.node, "value")) {
    return (graphArgs._output === undefined || graphArgs._output === "value") && lib.data.no.of(node_value(node.node))
  } else {
    // TODO: cleanup - hacky to rely on "arg"
    return nodeArgs.size === 1 && nodeArgs.keys().next().value.startsWith("arg")
      ? nodeArgs.values().next().value
      : (graphArgs._output === undefined || graphArgs._output === "value" || graphArgs._output === "display") && node_data(nodeArgs, graphArgs, lib, {...options, resolvePromises: true})
  }
}

// derives data from the args symbolic table
const create_data = (node_id: string, graph: Graph, graphArgs: Env, lib: Lib, options: RunOptions): Map<string, ConstRunnable> | Promise<Map<string, ConstRunnable>> => {
  return wrapPromiseAll([nolib.no.runtime.get_edges_in(graph, node_id), nolib.no.runtime.refs()])
    .then(([inputs, refs]: [Edge[], string[]]) => {
      const data: Map<string, ConstRunnable> = new Map()
      let input: Edge
      //TODO: remove
      const newgraphargs = graphArgs._output ? mergeEnv(new Map().set("_output", undefined), graphArgs) : graphArgs
      // delete newgraphargs._output
      //

      // grab inputs from state
      for (let i = 0; i < inputs.length; i++) {
        input = inputs[i]

        const val: ConstRunnable = {
          __kind: CONST, 
          graph: refs.includes(graph.id) ? graph.id : graph, 
          fn: input.from, 
          env: newgraphargs, 
          lib
        }
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
        data.set(input.as, val)
      }

      return data
    }).value
}

// handles graph things like edges
const run_graph = (graph: Graph, node_id: string, env: Env, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const newgraph = graph
  const node = lib.data.no.runtime.get_node(newgraph, node_id)

  if(!node) {
    // If a runnable is called after its fn is deleted but before it's recalculated, the ndoe won't exist. Instead of erroring, just return undefined.
    return
  }

  try {
    return wrapPromise(node).then(node => wrapPromise(create_data(node_id, newgraph, env, lib, options)).then(data => ({node, data})).value)
      .then(({node, data}) => {
        const graphid = (env.data.get("__graphid") as {value: string}).value
        if(!graphid.includes("/")) {
          lib.data.no.runtime.publish("noderun", {graph: newgraph, node_id})
        }


        if(options.profile && !nolib.no.runtime.get_parentest((env.data.get("__graphid") as {value: string}).value)) {
          const edgePath = edge => {
            const edgeout = nolib.no.runtime.get_edge_out(newgraph, edge)
            return edgeout && !ispromise(edgeout) ? [nolib.no.runtime.get_edge_out(newgraph, edge).as]
              .concat(edgePath(nolib.no.runtime.get_edge_out(newgraph, edge).to)) 
              : ["promise"]
          }
          const path = edgePath(node_id).reverse().join(" -> ")
          const start = performance.now()
          const id = `${path} - ${(env.data.get("__graphid") as {value: string}).value}/${node.id} (${node.ref})`
          // if(options?.profile && id) {
          //   console.time(id)
          //   performance.mark(`${id} - begin`)
          // }
          if(!options.timings) {
            options.timings = {}
          }

          const result = run_node(isRunnable(node) ? node : {node, graph}, data, env, lib, options)

          const isResPromise = ispromise(result)

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
            return v
          }) : result
        } else {
          return run_node(isRunnable(node) ? node : {node, graph}, data, env, lib, options)
        }
      }).value
  } catch (e) {
    return handleError(e, lib, env, graph, node)
  }
}

const run_functor_runnable = (runnable: FunctorRunnable, args: Args, lib: Lib, options: RunOptions): Result | Promise<Result> => {
  const execArgs: Args = new Map(runnable.parameters?.map(k => [k, nodysseus_get(args, k, lib)]) ?? [])
  const newRunnable: ConstRunnable = {
    __kind: CONST,
    env: combineEnv((execArgs ?? new Map()).set("__graphid", runnable.env.data.get("__graphid")), runnable.env, runnable.fn, runnable.env._output),
    fn: runnable.fn,
    graph: runnable.graph,
    lib: mergeLib(runnable.lib, lib)
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
          : new Map()
      return (Array.isArray(runnable.fn) ? runnable.fn : [runnable.fn])
        .reduce(
          (acc, rfn) => 
            acc.then(
              vrs => 
                (rfn === undefined || rfn === null
                  ? wrapPromise(undefined)
                  : typeof rfn === "function" 
                    ? wrapPromise(rfn(execArgs)).then(r => lib.data.no.of(r))
                    : isApFunction(rfn)
                      ? wrapPromise(run_extern(rfn, execArgs, lib, options))
                      : wrapPromise(run_runnable(
                        rfn as Runnable,
                        runnable.lib,
                        execArgs,
                        options
                      )))
                  .then(vr => vrs.concat([vr])))
          , wrapPromise([]))
        .then(r => Array.isArray(runnable.fn) ? r : r[0])
    }).value
}

const initStore = (store: NodysseusStore | undefined = undefined) => {
  if(store !== undefined) {
    nodysseus = store
  }

  if(!nolib.no.runtime) {
    nolib.no.runtime = nolib.no.runtimefn()
  }
}

export const run = (node: Runnable | InputRunnable, args: ResolvedArgs | Record<string, unknown> = new Map(), options: {lib?: Lib, store?: NodysseusStore} & RunOptions = {}) => {
  nodysseus = nodysseus ?? options.store ?? {
    refs: objectRefStore((isInputRunnable(node) || isFunctorRunnable(node)) && isGraph(node.graph) ? {[node.graph.id]: node.graph} : {}),
    persist: mapStore(),
    state: mapStore(),
    parents: mapStore(),
    fns: mapStore(),
    assets: mapStore(),
  }

  initStore(options.store ?? nodysseus)

  let _lib: Lib = mergeLib(options.lib, newLib(nolib))
  return wrapPromise(getRunnableGraph(node, _lib)).then(nodeGraph => {
    const cachedGraphLib = nodeGraph && nodysseus.state.get(`${nodeGraph.id}-lib`)
    if(cachedGraphLib) {
      _lib = mergeLib(cachedGraphLib, _lib)
    }
    if(isRunnable(node)) {
      if(isValue(node)) {
        return node.value
      } else if (isError(node)) {
        return node
      }
    }

    // isRunnable(node) && isFunctorRunnable(node) && getRunnableGraph(node, _lib) && _lib.data.no.runtime.change_graph(node.graph)
    // isRunnable(node) && isFunctorRunnable(node) && _lib.data.no.runtime.update_graph(node.graph, _lib);

    if(!(args instanceof Map)) {
      args = new Map(Object.entries(args))
    }

    for(const k of args.keys()) {
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
      _lib, args, options)
    return wrapPromise(res)
      .then(r => isValue(r) ? r?.value : r)
      .then(v => (options.profile && console.info(JSON.stringify(options.timings, null, 2)), isArgs(v) ? Object.fromEntries(v) : v)).value
  }).value
}

const runtimefn = () => {
  Object.values(generic_nodes).forEach(graph => {
    if(isNodeGraph(graph)) {
      graph.edges_in = Object.values(graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
    }
  })

  const {publish, addListener, removeListener, pauseGraphListeners, togglePause, isGraphidListened, isListened} = initListeners()

  const change_graph = (graph: Graph | string, lib: Lib | Record<string, any>, changedNodes: Array<string> = [], broadcast = false, source?): Graph | Promise<Graph>=>
    wrapPromise(get_parentest(graph))
      .then(parent => {
        if (parent) {
          return (lib.data ?? lib).no.runtime.change_graph(parent, lib, [(typeof graph === "string" ? graph : graph.id).substring(parent.id.length + 1)])
        } else {
          return wrapPromise(typeof graph === "string" ? get_ref(graph) : graph)
            .then(graph => {
              const changedNodesSet = new Set()
              while(changedNodes.length > 0) {
                const node = changedNodes.pop()
                if(!changedNodesSet.has(node)){
                  changedNodesSet.add(node)
                  Object.keys(descendantGraph(node, graph, (node) => node)).forEach(n => changedNodes.push(n))
                }
              }
              publish("graphchange", {graph, dirtyNodes: [...changedNodesSet.keys()], source}, isLib(lib) ? lib : newLib(lib), {}, broadcast)
              publish("graphupdate", {graph, dirtyNodes: [...changedNodesSet.keys()], source}, isLib(lib) ? lib : newLib(lib), {}, broadcast)
              return graph
            }).value
        }
      }).value

  const updatepublish = {}
  const update_args = (id, args, lib: Lib) => {
    let prevargs = nodysseus.state.get(id)
    const graphid = id.includes("#") ? id.split("#")[0] : id

    if (prevargs === undefined) {
      prevargs = {}
      nodysseus.state.set(id, prevargs)
    }


    if (!compareObjects(args, prevargs, true)) {
      Object.assign(prevargs, args)
      return wrapPromise(get_parentest(graphid))
        .then(parent => get_graph(parent ?? graphid))
        .then(updatedgraph => {
          if(updatedgraph && !ispromise(updatedgraph) && (!updatepublish[updatedgraph.id] || updatepublish[updatedgraph.id] + 16 < performance.now())) {
            // TODO: fix the use of / here
            let node_id = graphid.split(updatedgraph.id)[1].substring(1)
            node_id = node_id.indexOf("/") > 0 ? node_id.substring(0, node_id.indexOf("/")) : node_id

            publish("graphupdate", {graph: updatedgraph, dirtyNodes: node_id && Object.keys(descendantGraph(node_id, updatedgraph, node => node))}, lib)
          }
          return args;
        }).value
    }

    return args
  }

  const get_ref = (id, otherwise?) => {
    return wrapPromise(generic_nodes[id] ?? nodysseus.refs.get(id)).then(graph => {
      return graph ?? (otherwise && nodysseus.refs.set(id, {...otherwise, id, nodes: {...otherwise.nodes, [otherwise.out ?? "out"]: {...otherwise.nodes[otherwise.out ?? "out"], name: id}}}))
    }).value
  }
  const add_ref = (graph: NodysseusNode) => {
    return (Array.isArray(graph) ? graph : [graph])
      .map(graph => {
        if(generic_nodes[graph.id] === undefined) {
          nodysseus.refs.set(graph.id, graph)
          return graph
        }
      })[0]
  }
  const remove_ref = (id) => 
    wrapPromise(nodysseus.refs.keys()).then(keys => {
      if(keys.includes(id)) {
        return nodysseus.refs.delete(id)
      } else {
        return Promise.all(
          keys.filter(k => k.startsWith(`@${id}`))
            .map(k => nodysseus.refs.delete(k)))
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

  const get_args = (graph) => nodysseus.state.get(typeof graph === "string" ? graph : graph.id) ?? {}
  const get_graph = (graph: string | Graph): Graph | Promise<Graph> | undefined => wrapPromise(
    nodysseus.refs.get(typeof graph === "string" ? graph : graph.id))
    .then((g: NodysseusNode) => {
      return isNodeGraph(g) ? g : typeof graph !== "string" && isNodeGraph(graph) ? graph : undefined
    }).value
  const get_parent = (graph) => {
    return nodysseus.parents.get(
      typeof graph === "string" ? graph : graph && graph.id
    )
  }
  const getGraphIdRef = (graphid) => {
    return wrapPromise(nodysseus.parents.get( graphid)).then(res => res?.nodeRef).value
  }
  const get_parentest = (graph) => {
    return wrapPromise(nodysseus.parents.get(
      typeof graph === "string" ? graph : graph.id
    )).then(parent => parent && parent.parentest && get_graph(parent.parentest)).value
  }
  const get_path = (graph, path) => {
    graph = get_graph(graph)
    const pathSplit = path.split(".")
    let node = graph.out || "out"
    while (pathSplit.length > 0 && node) {
      const pathval = pathSplit.shift()
      const edge = get_edges_in(graph, node).find((e) => e.as === pathval)
      node = edge ? edge.from : undefined
    }
    return node
  }

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
    getGraphIdRef,
    get_fn: (id, name, orderedargs, script): Function => {
      const fnid = id
      return wrapPromise(nodysseus.fns.get(fnid + orderedargs)).then(fn => {
        if (!fn || fn.script !== script) {
          fn = Object.assign(fn ?? {}, {
            script,
            fn: new Function( `return function _${name.replace(
              /(\s|\/)/g,
              "_"
            )}(_lib, _node, _graph_input_value${orderedargs}){${script}}`
            )(),
            // ` this comment is here because my syntax highlighter is not well
          })

          nodysseus.fns.set(fnid + orderedargs, fn)
        }

        return fn.fn
      }).value
    },
    graphExport: (graphid): Array<Graph> | Promise<Array<Graph>> => 
      Object.keys(generic.nodes).includes(graphid) ? [] as Array<Graph>
      : wrapPromise(get_graph(graphid))
        .then(graph => 
          wrapPromiseAll(Object.values(graph.nodes)
            .map(node => isNodeRef(node) ? nolib.no.runtime.graphExport(node.ref) : []))
            .then<Graph[]>(nodeGraphs => nodeGraphs.flat().concat([graph])).value
        ).value,
    change_graph,
    update_graph: (graphid, lib: Lib) => publish("graphupdate", {graph: graphid}, lib),
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
    get_asset: (id) => id && nolib.no.runtime.store.assets.get(id),
    list_assets: () => nolib.no.runtime.store.assets.keys(),
    remove_asset: (id) => nolib.no.runtime.store.assets.delete(id),
    refs: () => nodysseus.refs.keys(),
    ref_graphs: async () => {
      const keys = await nodysseus.refs.keys()
      return keys
    },
    updateGraph: async ({graph, addedNodes = [], addedEdges = [], removedNodes = [], removedEdges = [], lib}: {
      graph: string | Graph, 
      addedEdges?: Array<Edge>, 
      removedEdges?: Array<{[k in Exclude<keyof Edge, "as">]: Edge[k]}>, 
      addedNodes?: Array<NodysseusNode>, 
      removedNodes?: Array<NodysseusNode>, 
      lib: Lib, 
      dryRun?: boolean
    }): Promise<Graph> => {
      const graphId = typeof graph === "string" ? graph : graph.id
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
      return change_graph(nodysseus.refs.get(graphId) as Graph, lib, addedEdges.map(e => e.to).concat(addedNodes.map(n => n.id)))
    },
    add_node: (graph: Graph, node: NodysseusNode, lib: Lib) => {
      if (!(node && typeof node === "object" && node.id)) {
        throw new Error(`Invalid node: ${JSON.stringify(node)}`)
      }

      // graph = get_graph(graph);

      // const new_graph = {
      //   ...graph,
      //   nodes: {...graph.nodes, [node.id]: node},
      // };

      // n.b. commented out because it blasts update_args which is not desirable
      // delete_cache(graph)
      const graphId = typeof graph === "string" ? graph : graph.id
      nodysseus.refs.add_node(graphId, node)
      change_graph(nodysseus.refs.get(graphId) as Graph, lib, [node.id])
    },
    add_nodes_edges: (graph, nodes: NodysseusNode[], edges: Edge[], remove_edges: Edge[], remove_nodes: NodysseusNode[], lib: Lib) => {
      const graphId = typeof graph === "string" ? graph : graph.id
      nodysseus.refs.add_nodes_edges({graphId, addedNodes: nodes, addedEdges: edges, removedEdges: remove_edges, removedNodes: remove_nodes})
      change_graph(
        nodysseus.refs.get(graphId) as Graph, 
        lib, 
        nodes.concat(remove_nodes)
          .map(n => n.id)
          .concat(edges.concat(remove_edges).flatMap(e => [e.to, e.from])))
    },
    delete_node: (graph: Graph, id, lib: Lib, changeEdges=true) => {
      wrapPromise(get_graph(graph)).then(graph => {
        const graphId = typeof graph === "string" ? graph : graph.id

        const parent_edge = lib.data.no.runtime.get_edge_out(graph, id)
        const child_edges = lib.data.no.runtime.get_edges_in(graph, id)

        const current_child_edges = lib.data.no.runtime.get_edges_in(graph, parent_edge.to)
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
        }))


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
            current_child_edges.concat(new_child_edges).flatMap(e => [e.to, e.from]))
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
    set_parent: (graph, parent, nodeRef?: string) => {
      const graphid = graph
      const parentid = parent
      return wrapPromise(nodysseus.parents.get(parentid)).then(parent_parent => {
        const parentest =
              (parent_parent ? parent_parent.parentest : false) || parentid
        const new_parent = {
          id: graphid,
          parent: parentid,
          parentest,
          nodeRef
        }
        nodysseus.parents.set(graphid, new_parent)
      }).value
    },
    undo: (id: string) => nodysseus.refs.undo && nodysseus.refs.undo(id),
    redo: (id: string) => nodysseus.refs.redo && nodysseus.refs.redo(id),
    store: nodysseus,
    ancestor_graph
  } as const
}

type Runtime = ReturnType<typeof runtimefn>;


const nolib: Record<string, any> & {no: {runtime: Runtime} & Record<string, any>} = {
  no: {
    of: (value): Result | Promise<Runnable> => ispromise(value) ? value.then(nolib.no.of) : isValue(value) ? value : { __kind: "result", value: value},
    arg: (node, target: Env, lib: Lib, value, options: RunOptions) => {
      value = node.value
      if(!value) return
      let valuetype, nodevalue
      const colonIdx = value.indexOf(":")
      if(colonIdx >= 0) {
        nodevalue = value.substring(0, colonIdx)
        valuetype = value.substring(colonIdx + 2)
      } else {
        nodevalue = value
      }

      const newtarget = () => {
        const newt = new Map(target.data)
        for(const k in newt) {
          if(k.startsWith("_")) {
            newt.delete(k)
          }
        }
        return newt
      }

      const parenttarget = () => {
        const newt = new Map(target.env.data)
        for(const k in newt) {
          if(k.startsWith("_")) {
            newt.delete(k)
          }
        }
        return newt
      }

      const ret = nodevalue === undefined || target === undefined
        ? undefined
        : nodevalue === "__node" ? node
        : nodevalue.startsWith("__node.") ? node[nodevalue.substring("__node.".length)]
        : nodevalue.startsWith("_lib.") ? nodysseus_get(lib.data, nodevalue.substring("_lib.".length), lib)
        : nodevalue === "_args" ? newtarget()
        : nodevalue === "_argsdata" ? resolve_args(newtarget(), lib, options)
        : nodevalue === "__args" ? parenttarget()
        : nodysseus_get(
          node.type === "local" || node.type?.includes?.("local")
            ? newtarget()
            : node.type === "parent" || node.type?.includes?.("parent")
              ? target.env
              : target,
          nodevalue,
          lib
        )

      // let retrun = run_runnable(ret, lib);
      // let resolveret = (rr) => {
      //   const retrun = isValue(rr) && isConstRunnable(rr.value) && valuetype !== "raw" ? run_runnable(rr, lib, undefined, options) : undefined
      //   return  ispromise(retrun) ? retrun.then(v => isError(v) ? v : v?.value) : retrun ? isValue(retrun) || isWrappedPromise(retrun) ? retrun?.value : retrun : rr;
      // }
      const resolveret = (rr) =>
        wrapPromise(rr)
          .then(rrr => isValue(rrr) ? rrr.value : rrr)
          .then(rrr => isConstRunnable(rrr) && valuetype !== "raw" ? resolveret(run_runnable(rrr, lib, new Map(), options)) : rrr).value
          

      return resolveret(ret)
    },
    base_graph,
    base_node,
    nodysseus_get,
    ispromise,
    NodysseusError,
    runtime: undefined,
    wrapPromise,
    runtimefn,
    isMemory
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
            .then(r => resolveRunnable(isValue(r) ? r.value : r)) 
          : wrapPromise(runnable)).then(r => isValue(r) ? r.value : r).value

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
                .forEach(([inputid, graph, node]: [string, Graph, NodysseusNode]) => lib.data.no.runtime.pauseGraphListeners(`${graph.id}/${node.id}`, ival !== inputid))
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
            return res
          })
      },
    },
    resolve: {
      rawArgs: false,
      args: ["object", "_lib"],
      fn: (object: Args, lib) => {
        return Object.fromEntries(Object.entries(object).map(e => [e[0], run_runnable(e[1], lib)]))
      }
    },
    map: {
      rawArgs: true,
      outputs: {
        metadata: true
      },
      args: ["fn", "array", "_lib", "_runoptions", "_output"],
      fn: (fn, array, lib, options, _output) =>
        _output === "metadata"
          ? {
            parameters: {
              fn: {
                type: "@flow.runnable",
                runnableParameters: ["element", "index"]
              },
              array: "@data.array"
            }
          }
          : wrapPromise(run_runnable(array, lib, undefined, options))
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
      args: ["fn", "object", "initial", "_lib", "_runoptions", "_output"],
      fn: (fn, object, initial, lib: Lib, options, _output) =>
        _output === "metadata"
          ? {
            parameters: {
              fn: {
                type: "@flow.runnable",
                runnableParameters: ["element", "index"]
              },
              array: "@data.array"
            }
          }
          : wrapPromise(run_runnable(object, lib, undefined, options))
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
                          : Object.entries(mapobj).sort((a, b) => a[0].localeCompare(b[0])).reduce(mapfn, mapinit)

                      initial = initial ?? (typeof objectvalue.reduce === "function" ? [] : {})

                      let errored = false
                      // const errorlistener = (error) => errored = true

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
                              errored = true
                              return rv
                            }
                            return rv.value
                          }).value,
                        initial
                      )

                      // lib.data.no.runtime.removeListener('grapherror', fnrunnable.graph.id + "/" + fnrunnable.fn, errorlistener)

                      return lib.data.no.of(ret)
                    })))
            .value,
    },
    runnable: {
      rawArgs: true,
      args: ["fn: default", "parameters", "_lib", "_runoptions", "output", "includeFullGraph"],
      fn: createFunctorRunnable
    },
    workerRunnable: {
      args: ["graph"],
      fn: () => {}
    },
    graphRunnable: {
      rawArgs: true,
      args: ["graph", "parameters", "_lib", "_runoptions", "output", "graphid", "env", "out", "__graphid"],
      fn: createGraphFunctorRunnable
    },
    expect: {
      args: ["a", "b", "__graph_value"],
      fn: externs.expect
    },
    entries: {
      args: ["object"],
      fn: (obj) => {
        return Object.entries(obj)
      },
    },
    fromEntries: {
      args: ["entries"],
      fn: (entries) => {
        return Object.fromEntries(entries)
      },
    },
    cache: {
      args: ["value", "recache"],
      fn: () => {}
    },
    readReference: {
      args: ["reference"],
      fn: (reference) => {
        const ret = reference.value.value.read();
        if(ret && ret.__kind === "nodthing") {
          return undefined;
        }
      }
    },
    reference: {
      rawArgs: true,
      outputs: {
        display: true
      },
      args: ["onframe", "_lib", "__graphid", "_runoptions", "_output", "initial", "publish", "persist"],
      fn: (onframe, lib, graphid, options, output, initial, publish, id) => {
        return wrapPromiseAll([
          publish && run_runnable(publish, lib, undefined, options),
          id && run_runnable(id, lib, undefined, options)
        ]).then(([publish, id]) => [
          isValue(publish) ? publish.value : publish,
          isValue(id) ? id.value : id,
        ]).then(([publish, id]) => {
          const stateId = id ? `${lib.data.no.runtime.get_parent(graphid)}#${id}` : graphid
          const args = lib.data.no.runtime.get_args(stateId)

          const store = args["store"] ?? {
            __kind: "reference",
            id: stateId,
            set: {
              __kind: "apFunction",
              fn: (value) => {
                if(store["publish"]) {
                  lib.data.no.runtime.publish("argsupdate", {id: stateId, changes: [["store.value", value]], mutate: true}, lib, options)
                } else {
                  store["value"] = value
                }
                return value
              },
              args: ["value"],
            },
            publish,
            value: undefined
          } as MemoryReference

          if(!args["store"]) {
            lib.data.no.runtime.update_args(stateId, {store}, lib)
            if(initial) {
              return wrapPromise(run_runnable(initial, lib, undefined, options))
                .then(res => isValue(res) ? res.value : res)
                .then(value => {
                  store.value = value
                  return store
                }).value
            }
          } else {
            args["store"].publish = publish
          }

          if(onframe) {
            const onframeArgs = new Map([["reference", store]])
            wrapPromise(run_runnable(onframe, lib))
              .then(onframeRunnable => isValue(onframeRunnable) && nolib.no.runtime.addListener("animationframe", stateId, () => {
                wrapPromise(run_runnable(onframeRunnable.value, lib, onframeArgs)).then(frameresult => {
                  if(isValue(frameresult)){ 
                    args["store"].value = frameresult.value
                  }
                })
              }))
          }

          return output === "display" ? {dom_type: "div", props: {}, children: [{dom_type: "text_value", text: JSON.stringify(store.value)}]} : store
        }).value
      }
    },
    persistState: {
      args: ["kvs"],
      fn: (kvs) => kvs && typeof kvs === "object" && wrapPromiseAll(Object.entries(kvs).map(kv => nodysseus.persist.set(...kv))).value
    },
    state: {
      rawArgs: true,
      outputs: {
        display: true
      },
      args: ["value", "_lib", "__graphid", "_runoptions", "_output", "persist", "publish"],
      fn: (value, lib, graphid, options, output, persist, publish, id) => {
        return wrapPromiseAll([
          publish && run_runnable(publish, lib, undefined, options),
          persist && run_runnable(persist, lib, undefined, options),
          id && run_runnable(id, lib, undefined, options)
        ]).then(([publish, persist, id]) => [
          isValue(publish) ? publish.value : publish,
          isValue(persist) ? persist.value : persist,
          isValue(id) ? id.value : id,
        ])
          .then(([publish, persist, id]) => {
            const stateId = id ? `${lib.data.no.runtime.get_parent(graphid)}#${id}` : graphid
            return {
              publish,
              persist: persist,
              stateId,  
              rawstate: lib.data.no.runtime.get_args(stateId)["state"]
            }
          })
          .then( ({publish, persist, stateId, rawstate}) => {
            if(rawstate !== undefined) return {publish, persist, stateId, rawstate}
            const persistedState = persist && rawstate === undefined && nodysseus.persist.get(stateId)
            const initialState = wrapPromise(persistedState)
              .then(ps => ps ? JSON.parse(ps)
              : value && (rawstate === undefined || rawstate === null)
                ? wrapPromise(run_runnable(value, lib, undefined, options))
                  .then(result => isValue(result) ? result.value : result)
                : undefined)
            return initialState ? initialState
              .then(initial => {
                if(publish) {
                  lib.data.no.runtime.publish("argsupdate", {id: stateId, changes: {state: initial}, mutate: false}, lib, options, true)
                } else {
                  lib.data.no.runtime.update_args(stateId, {state: initial})
                }

                return initial
              }).then(initial => ({publish, persist, initial, stateId})).value 
              : {publish, persist, stateId}
          })
          .then(({persist, publish, initial, stateId, rawstate}: {persist, publish, stateId, rawstate, initial?}) => 
            wrapPromise(rawstate)
              .then(rawstate => isValue(rawstate) ? rawstate.value : rawstate)
              .then(state => ({publish, persist, state, stateId, initial})).value)
          .then(({persist, publish, state, stateId, initial}) => output === "display" 
            ? lib.data.no.of({dom_type: "div", props: {}, children: [{dom_type: "text_value", text: JSON.stringify(state)}]}) 
            : ({
              __kind: "state",
              id: stateId,
              set: {
                __kind: "apFunction",
                promiseArgs: true,
                fn: (value) => {
                  const result = value === undefined || value === null ? undefined : run_runnable(value, lib, undefined, {resolvePromises: false})
                  const promiseresult = ispromise(result) ? result.then(r => isValue(r) ? r.value : r) : isValue(result) ? result.value : result
                  const isresultpromise = ispromise(promiseresult)

                  if(publish) {
                    nolib.no.runtime.publish("argsupdate", {id: stateId, changes: {state: promiseresult}, mutate: false}, lib, options, true)
                  } else {
                    if(!(isresultpromise && state)) {
                      lib.data.no.runtime.update_args(stateId, {state: promiseresult}, lib)
                    }
                  }

                  if(!isresultpromise && persist) {

                    nodysseus.persist.set(stateId, JSON.stringify(promiseresult))
                  }

                  return isresultpromise ? promiseresult.then(pr => {
                    if(persist) {
                      nodysseus.persist.set(stateId, JSON.stringify(pr))
                    }

                    if(publish) {
                      lib.data.no.runtime.publish("argsupdate", {id: stateId, changes: {state: pr}, mutate: false}, lib, options, true)
                    } else {
                      lib.data.no.runtime.update_args(stateId, {state: pr}, lib)
                    }
                    return pr
                  }) : promiseresult
                },
                args: ["value"]
              },
              state: state ?? initial,
            } as MemoryState)).value
      }
    },
    // cache: {
    //   args: ["value", "recache", ]
    // },
    frame: {
      args: ["_lib", "__graphid"],
      fn: (_lib, __graphid) => {
        const current = _lib.data.no.runtime.get_args(__graphid)?.cache 
        if(current) return current
        let frame = 0
        const updateFrame = () => {
          frame += 1
          requestAnimationFrame(updateFrame)
        }
        const cache = externs.memoryCacheOf(cachedFrame => cachedFrame !== frame, () => frame)
        _lib.data.no.runtime.update_args(__graphid, {cache})
        updateFrame()
        return cache
      }
    },
    memoryUnwrap: {
      args: ["value: default"],
      fn: externs.memoryUnwrap
    },
    runNode: {
      args: ["node"],
      fn: () => {}
    },
    nodeDisplay: {
      args: ["__grph_value"],
      fn: () => {}
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
      args: {
        "value": {
          type: "any",
          default: true
        },
        "display": {
          type: {
            "background": "@html.html_element",
            "resultPanel": "@html.html_element"
          }
        },
        "subscribe": "any",
        "dependencies": "any",
        "metadata": {
          type: {
            parameters: (graph: Graph, nodeId: string) => ({type: Object.fromEntries(Object.values(ancestor_graph(nodeId, graph).nodes).filter(n => isNodeRef(n) && n.ref === "arg" && n.value && !n.value.startsWith("_")).map((n: ValueNode & RefNode) => [n.value.includes(".") ? n.value.split(".")[0] : n.value, "any"]))}),
            values: "any",
            dataLabel: "any",
            language: "any"
          },
        },
        "args": "any",
        "lib": "any",
        "_output": "string",
        "_lib": "any",
        "_runoptions": "any",
        "__graphid": "string"
      },
      fn: ({
        value,
        display,
        subscribe,
        metadata,
        args,
        lib,
        _output,
        _lib,
        _runoptions,
        __graphid
      }) => {
        const output = _output
        const argsfn = args
        const graphid = __graphid
        const options = _runoptions
        const edgemap = { value, display, subscribe, metadata, lib }

        if((output === "display" || output === "metadata") && !edgemap[output]) {
          return
        }

        const runedge = output && output === display ? display : edgemap[output] ? output : "value"

        // _lib.data.no.runtime.removeAncestorListeners(graphid)

        const return_result = (_lib: Lib, args: Args) => {
          args = args && !isArgs(args) ? new Map(Object.entries(args)) : args

          const runnable = edgemap[runedge] ? edgemap[runedge] : runedge === "value" && !value && display ? display : _lib.data.no.of(undefined)
          if(isRunnable(runnable) && !isError(runnable) && !isValue(runnable) && !isApRunnable(runnable)) {
            runnable.env = combineEnv(runnable.env.data, newEnv(args, _lib.data.no.of(runedge === "display" ? "display" : "value"), runnable.env))
          }

          if(lib !== undefined) {
            runnable.lib = _lib
          }


          const runedgeresult = run_runnable(runnable, _lib, undefined, options)
          if (edgemap.subscribe && (runedge === "display" || runedge === "value")) {
            const newgraphid = graphid

            wrapPromise(run_runnable(
              edgemap.subscribe,
              _lib,
              args,
              {...options, resolvePromises: true}
            ))
              .then(subscriptions => isValue(subscriptions) ? subscriptions.value : subscriptions)
              .then(subscriptions => subscriptions && Object.entries(subscriptions)
                .forEach(kv => kv[1] &&
                  _lib.data.no.runtime.addListener(kv[0], newgraphid, kv[1], false, 
                    graphid, true, _lib, options)))
          }

          if(edgemap.display) {
            const displayStateId = `${display.env.data.get("__graphid").value}/${display.fn}-display-runnable`
            nodysseus.state.set(displayStateId, display)
          }

          return runedgeresult
        }

        const ret = wrapPromise(run_runnable(lib, _lib, undefined, {...options, resolvePromises: true}))
          .then(libr => isError(libr) ? libr : libr?.value)
          .then(libr => (libr && `${lib.graph.id}/${lib.graph.out ?? "out"}` === graphid && nodysseus.state.set(`${lib.graph.id ?? lib.graph}-lib`, libr), libr))
          .then(libr => wrapPromise(argsfn ? run_runnable({
            ...argsfn,
            lib: mergeLib(newLib(libr), _lib)
          }, _lib, undefined, {...options, isNoResolve: true, resolvePromises: true}) : undefined)
            .then(args => return_result(mergeLib(newLib(libr), _lib), isValue(args) ? args?.value : args))).value
        return ret
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
          : []
        if(_output === "metadata") {
          return {
            values: getPrototypeNames(target)
          }
        }
        const _path = __graph_value || path
        return _path ? _lib.data.no.nodysseus_get(
          _path.startsWith("lib") ? _lib.data : target,
          _path.startsWith("lib") ? _path.substring(3) : _path,
          _lib, 
          def
        ) : target
      },
    },
    set: {
      args: ["target: default", "path", "value", "__graph_value"],
      fn: (target, path, value, nodevalue) => {
        const ispromise = <T>(a: any): a is Promise<T> => a && typeof a.then === "function" && !isWrappedPromise(a)
        const keys = (nodevalue || path).split(".")
        const check = (o, v, k) =>
          k.length === 1
            ? { ...o, [k[0]]: v }
            : o && typeof o === "object" && Object.hasOwn(o, k[0])
              ? {
                ...o,
                [k[0]]: check(o[k[0]], v, k.slice(1)),
              }
              : o
        const ret = (
          ((value !== undefined && ispromise(value)) || ispromise(target)
            ? Promise.all([
              Promise.resolve(value),
              Promise.resolve(target),
            ]).then((vt) => vt[1] !== undefined && check(vt[1], vt[0], keys))
            : check(target, value, keys))
        )
        return ret
      },
    },
    set_mutable: {
      args: ["target: default", "path", "value", "__graph_value", "_lib"],
      fn: (target, path, value, nodevalue, _lib) => {
        function set(obj, propsArg, value) {
          let props
          if (Array.isArray(propsArg)) {
            props = propsArg.slice(0)
          }
          if (typeof propsArg == "string") {
            props = propsArg.split(".")
          }
          if (typeof propsArg == "symbol") {
            props = [propsArg]
          }
          if (!Array.isArray(props)) {
            throw new Error("props arg must be an array, a string or a symbol")
          }
          const lastProp = props.pop()
          if (!lastProp) {
            return false
          }
          let thisProp
          while ((thisProp = props.shift())) {
            if (typeof obj[thisProp] == "undefined") {
              obj[thisProp] = {}
            }
            obj = obj[thisProp]
            if (!obj || typeof obj != "object") {
              return false
            }
          }
          obj[lastProp] = value
          return true
        }
        if(target && (nodevalue || path)) {
          set(target, nodevalue || path, (_lib.data ?? _lib).no.isMemory(value) ? externs.memoryUnwrap(value) : value)
        }
        return target
      },
    },
    liftarraypromise: {
      args: ["array"],
      resolve: true,
      fn: (array) => {
        const isarraypromise = array.reduce(
          (acc, v) => acc || ispromise(v),
          false
        )
        return isarraypromise ? Promise.all(array) : array
      },
    },
    script: {
      outputs: {
        metadata: true
      },
      args: ["_node", "_node_args", "_graph", "_lib", "_runoptions", "_output"],
      fn: (node, node_inputs, graph, _lib, options, _output) =>
        _output === "metadata" ? {
          dataLabel: "script"
        } : node_script(
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
      fn: (url, graphvalue) => {
        console.log("importing", url, graphvalue)
        const urlval = url || graphvalue
        if(!urlval) return
        const stateid = `__jsimport:${urlval}`
        const existing = nodysseus.state.get(stateid)
        if(existing) return existing
        const promise = import(urlval).then(jsmodule => jsmodule.default ?? jsmodule).then(jsmodule => (nodysseus.state.set(stateid, jsmodule), jsmodule))
        nodysseus.state.set(stateid, promise)
        return promise
      }
    },
    update_args: {
      promiseArgs: true,
      args: ["path", "value", "__graphid", "_lib"],
      resolve: false,
      fn: (path, value, graphid, lib) => {
        const pathresult = run_runnable(path, lib) as Result
        path = isValue(pathresult) ? pathresult.value : pathresult
        const result = value === undefined || value === null ? undefined : run_runnable(value, lib)

        if(isError(pathresult)) {
          throw pathresult
        }

        const promiseresult = ispromise(result) ? result.then(r => isValue(r) ? r.value : r) : isValue(result) ? result.value : result

        lib.data.no.runtime.update_args(graphid, {[path]: promiseresult})

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
            .filter(n => typeof Object.getOwnPropertyDescriptor(obj, n).value === "function")
            .concat(getPrototypeChainMethods(Object.getPrototypeOf(obj)))
          : []
        const nodevalue = __graph_value
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
                        ? acc[1].concat(v)
                        : acc[1],
                    ],
                    [false, []]
                  )[1]
                  .reverse()
              )
              : self(args === undefined ? [] : args)
          } else {
            const ng_fn = (_lib.data ?? _lib).no.nodysseus_get(self ?? (_lib.data ?? _lib), fn || nodevalue, (_lib.data ?? _lib))
            const ng_self = (fn || nodevalue)?.includes(".")
              ? (_lib.data ?? _lib).no.nodysseus_get(self, (fn || nodevalue).substring(0, (fn || nodevalue).lastIndexOf(".")), (_lib.data ?? _lib)) 
              : self
            if (_output === "metadata"){
              const parameters = typeof ng_fn === "function" ? (_lib.data ?? _lib).extern.functionParameters.fn(ng_fn) : []
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
                      ? acc[1].concat(v)
                      : acc[1],
                  ],
                  [false, []]
                )[1]
                .reverse()
              : args === undefined
                ? []
                : [args]
            const ret = (_lib.data ?? _lib).no.of((_lib.data ?? _lib).no.ispromise(ng_fn)
              ? ng_fn.then((f: any) => f.apply(fnargs))
              : typeof ng_fn === "function"
                ? ng_fn.apply(ng_self, fnargs)
                : ng_self)
            return ret
          }
        }

        return (_lib.data ?? _lib).no.ispromise(args) ? args.then(runfn) : runfn(args)
      },
    },
    merge_objects_mutable: {
      args: ["target: default", "_node_args", "_lib", "_runoptions"],
      fn: (target, args, lib, options) => {
        const merge = (target = {}, value) =>
          Object.entries(value)
            .filter(kv => !kv[0].startsWith("_"))
            .map(kv => isArgs(kv[1]) ? [kv[0], Object.fromEntries(kv[1].entries())] : kv)
            .forEach(([k, v]: [string, unknown]) => {
              if(typeof v === "object" && typeof target[k] === "object" && target[k] !== null) {
                merge(target[k], v)
              } else {
                target[k] = v
              }
            })

        return wrapPromiseAll(Object.keys(args).filter(k => k !== "target")
          .map(k => [k, isRunnable(args[k]) ? run_runnable(args[k], lib) : args[k]]))
          .then(inputs => wrapPromiseAll(inputs
            .map(kv => [kv[0], isValue(kv[1]) ? kv[1].value : kv[1]])
            .map(kv => [kv[0], isArgs(kv[1]) ? resolve_args(kv[1], lib, options) : kv[1]]))
            .then(kvs => Object.fromEntries(kvs.map(kv => [kv[0], isValue(kv[1]) ? kv[1].value : kv[1]]))).value
          )
          .then(resolved => {
            Object.values(resolved).forEach(v => merge(target, v))
            return target
          }).value
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
        while (target) {
          target = target._value
        }
        const newval = Object.assign({}, target)
        delete newval[path]
        return newval
      },
    },
    now: {
      args: ["scale"],
      fn: externs.now
    },
    not: {
      args: ["value"],
      fn: value => !value
    },
    math: {
      args: ["__graph_value", "_node_args"],
      resolve: true,
      fn: (graph_value, args) => Math[graph_value](...Object.entries(args).filter(kv => kv[0] !== "__graph_value").sort((a, b) => a[0].localeCompare(b[0])).map(kv => externs.memoryUnwrap(kv[1])))
    },
    add: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) =>
        wrapPromiseAll(Object.entries(args)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(kv => kv[1]))
          .then(inputs => inputs.map(i => i && isResult(i) ? i.value : i)
            .reduce((acc, v) => {
              if(acc?.__kind === "cache" && v?.__kind !== "cache") {
                return externs.bindMemoryCache(acc)(value => externs.memoryCacheOf(() => false, () => value + externs.memoryUnwrap(v)))
              } else if(acc?.__kind !== "cache" && v?.__kind === "cache") {
                return externs.bindMemoryCache(v)(value => externs.memoryCacheOf(() => false, () => value + externs.memoryUnwrap(acc)))
              }
              return (acc as any) + externs.memoryUnwrap(v) as any
            })),
    },
    and: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc && !!v, true),
    },
    or: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc, v) => acc || !!v, false),
    },
    mult: {
      args: ["_node_args"],
      resolve: true,
      //TODO: change this back to wrapPromiseAll version
      fn: (args) => Object.entries(args)
          .reduce((acc, e) => acc * (e[1] as number), 1),
      _fn: (args) =>
        wrapPromiseAll(Object.entries(args)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(kv => kv[1]))
          .then(inputs => inputs.map(i => i && isResult(i) ? i.value : i)
            .reduce((acc, v) => {
              if(acc?.__kind === "cache" && v?.__kind !== "cache") {
                const ret = externs.bindMemoryCache(acc)((value: number) => externs.memoryCacheOf(val => val === undefined, () => value * externs.memoryUnwrap(v)))
                return ret;
              } else if(acc?.__kind !== "cache" && v?.__kind === "cache") {
                return externs.bindMemoryCache(v)((value: number) => externs.memoryCacheOf(val => val === undefined, () => value * externs.memoryUnwrap(acc)))
              }
              return (acc as any) + externs.memoryUnwrap(v) as any
            })),
    },
    negate: {
      args: ["value"],
      resolve: true,
      fn: (value) => -value,
    },
    divide: {
      args: ["_node_args"],
      resolve: true,
      fn: (args) => Object.values(args).reduce((acc: any, v: any) => acc / externs.memoryUnwrap(v), 1),
    },
    convertAngle: {
      args: ["degrees", "radians"],
      fn: (degrees, radians) => {
        if(degrees && radians) {
          throw new Error("Got both degrees and radians!")
        }

        return degrees ? degrees * Math.PI / 180 : radians * 180 / Math.PI
      }
    },
    random: {
      args: ["seed"],
      fn: (seed = 128) => () => {
        let t = seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
      }
    },
    modify: {
      args: ["target", "path", "fn", "_node", "_lib", "_graph_input_value", "_runoptions"],
      resolve: false,
      fn: (target, path, fn, node, _lib, args, options) => {
        const keys = (node.value || path).split(".")
        const check = (o, fn, k) =>
          k.length === 1
            ? {
              ...o,
              [k[0]]: run_graph(fn.graph, fn.fn, {
                ...args,
                value: o[k[0]],
              }, _lib, options),
            }
            : o && typeof o === "object" && Object.hasOwn(o, k[0])
              ? {
                ...o,
                [k[0]]: check(o[k[0]], fn, k.slice(1)),
              }
              : o
        return check(target, fn, keys)
      },
    },
    stringify: {
      args: ["object", "spacer"],
      resolve: true,
      fn: (obj, spacer) =>
        JSON.stringify(
          obj,
          (key, value) => value,
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
      fn: ({args, name, __graph_value, _lib}) => {
        const fn = nodysseus_get(_lib.data, name || __graph_value, _lib, typeof window !== "undefined" ? window[__graph_value] : self[__graph_value])
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
        return target
      }
    },
    data: {
      args: ["_node_args"],
      fn: (node_args) => node_args
    },
    graphState: {
      args: ["graphid"],
      fn: (graphid: string) => 
        wrapPromise(nodysseus.persist.keys())
          .then(
            keys => 
              wrapPromiseAll(
                keys
                  .filter(k => k.startsWith(graphid))
                  .map(k => nodysseus.persist.get(k).then(v => [k, v])))
                .then(kvs => Object.fromEntries(kvs)).value)
          .value
    },
    functionParameters: {
      args:["fn"],
      fn: (fn) => {
        const fnstring = fn.toString()
        // hacky: return the first set of parameters we find
        let foundParams = false, pastParams = false
        const args = []
        parser.parse(fnstring).iterate({
          enter: syntaxNode => {
            if(!pastParams && syntaxNode.matchContext(["ParamList"]) && syntaxNode.name === "VariableDefinition" && !syntaxNode.matchContext(["Arrow"])) {
              foundParams = true
              args.push(fnstring.substring(syntaxNode.from, syntaxNode.to))
            } else if (!pastParams && foundParams && !syntaxNode.matchContext(["ParamList"])) {
              pastParams = true
            }
          }
        })
        return args
      }
    }
  } as Record<string, Extern>,
  // THREE
}

const nolibLib = newLib(nolib)

export {nolib, nolibLib, initStore, compare, hashcode, ispromise, NodysseusError, resfetch, resolve_args }



