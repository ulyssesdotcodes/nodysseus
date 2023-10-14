import * as util from "./util.js"
import {NodysseusError, nodysseus_get, resolve_args} from "./nodysseus.js"
import { NodysseusNode, Graph, Args, ConstRunnable, Env, isArgs, isEnv, isNodeRef, isValue, Lib, RefNode, Edge, TypedArg } from "./types.js"


const nodeinputs = (node: NodysseusNode, graph: Graph) => Object.values(graph.edges_in[node.id] ?? []).map(edge => ({edge, node: graph.nodes[edge.from]}))
const nodefn = (node, graphid, args) => isNodeRef(node) && node.ref === "arg" ? args.has(node.value) ? args.get(node.value) : createArg(node.value) : `fn_${graphid}${node.id}()`
const createArg = (name) => `fnargs["${argToProperties(name)}"] ?? baseArgs["${name}"]` 
const argToProperties = (arg: string) => arg.includes(".") ? arg.split(".").join("\"]?.[\"") : arg


const graphToFnBody = (runnable: ConstRunnable, lib: Lib, graphid: string = "", args: Map<string, string> = new Map()) => 
  !runnable ? undefined
  : util
    .wrapPromise(lib.data.no.runtime.get_ref(runnable.graph))
    .then(fromGraph => {
      // hack for return to only get "value" input
      while(fromGraph.nodes[runnable.fn]?.ref === "return") {
        runnable.fn = Object.values<Edge>(fromGraph.edges_in[runnable.fn]).find((e: Edge) => e.as === "value").from
      }
      const graph = util.ancestor_graph(runnable.fn, fromGraph, lib.data)
      const graphArgs = new Set(Object.values(graph.nodes).filter<RefNode>(isNodeRef).filter(n => n.ref === "arg").map(a => a.value))
      return {graph,graphArgs}
    }).then(({graph, graphArgs}: {graph: Graph, graphArgs: Set<string>}) =>
      util.wrapPromise(resolve_args(new Map([...graphArgs].map(a => [a, nodysseus_get(runnable.env, a, lib)])), lib, {resolvePromises: true}))
        .then(result => {
          if(!isValue(result)) return
          const baseArgs = typeof result.value?.includes === "function" && result.value.includes(".") ? result.value.substring(0, result.value.indexOf(".")) : result.value
          // graph.id = runnable.fn + "-fn";

          let text = ""
          const _extern_args = {}

          return util.wrapPromise(
            Object.values(graph.nodes).reduce((acc, n) => 
              acc.then(() => {
                if(isNodeRef(n) && n.ref === "arg") {
                  return
                }
                return isNodeRef(n) ? lib.data.no.runtime.get_ref(n.ref) : n
              }).then(noderef => {
                if(!noderef) return

                const inputs = nodeinputs(n, graph)
                if((isNodeRef(n) && n.ref === "@js.script")) {
                  text += `
      function fn_${graphid}${n.id}(){
        ${inputs.map(input => 
    `let ${input.edge.as} = ${nodefn(input.node, graphid, args)};`
  ).join("\n")
}

      ${n.value}

      }

      `
                } else if (noderef.id === "@data.get"){
                  const inputs = Object.values(graph.edges_in[n.id] ?? []).map(edge => ({edge, node: Object.values(graph.nodes).find(n => n.id === edge.from)}))
                  text += `
      function fn_${graphid}${n.id}(){
        ${inputs
    .map(input => `let ${input.edge.as} = ${isNodeRef(input.node) && input.node.ref === "arg" && input.node.value === "_lib" ? "_lib" : nodefn(input.node, graphid, args)}`)
    .join("\n")}
        return target["${argToProperties(isNodeRef(n) ? n.value : "undefined")}"];
      }

      `
                } else if (noderef.id === "return") {
                  const valueinput = inputs.find(input => input.edge.as === "value")
                  text += `
                  function fn_${graphid}${n.id}() {
                    return ${valueinput ? nodefn(valueinput.node, graphid, args) : "undefined"};
                  }
                  `
                } else if(noderef.ref == "extern") {
                  _extern_args[graphid + n.id] = {}
                  const extern = nodysseus_get(lib.data, noderef.value, lib)
                  const varset = []
                  const externArgs: Array<[string, TypedArg]>  = Array.isArray(extern.args) ? extern.args.map(rawa =>
                    [rawa.includes(":") ? rawa.substring(0, rawa.indexOf(":")) : rawa, "any"]) : 
                    Object.entries(extern.args)
                  externArgs.forEach(([a]: [string, TypedArg]): void => {
                    if(a === "__graph_value" || a === "_node") {
                      _extern_args[graphid + n.id][a] = a === "__graph_value" ? n.value
                        : a === "_node" ? n
                        : undefined
                      varset.push(`let ${a} = _extern_args["${graphid}${n.id}"]["${a}"];`)
                    } else if (a === "_node_args") {
                      varset.push(`
      let ${a} = {
        ${inputs.map(input => 
    `${input.edge.as}: ${nodefn(input.node, graphid, args)}`).join(",\n")}
      };`)
                    } else {
                      const input = inputs.find(i => i.edge.as === a)
                      if(a === "_lib") {
                        // don't shadow _lib
                      } else if(!input){
                        varset.push(`let ${a} = undefined;`)
                      } else {
                        const inputNode = Object.values(graph.nodes).find(n => n.id === input.edge.from)
                        varset.push(`
      let ${a} = ${nodefn(inputNode, graphid, args)};
      `)
                      }
                    }
                  })
                  const argsString = externArgs.map((a: [string, TypedArg]): string => a[0])
                  text += `
      function fn_${graphid}${n.id}(){
        ${varset.join("\n")}
        return (${extern.fn.toString()})(${Array.isArray(extern.args) ? argsString : `{${argsString}}`});
      }

      `
                } else if (isNodeRef(n)) {
                  return util.wrapPromise(graphToFnBody({
                    __kind: "const",
                    fn: noderef.out ?? "out",
                    graph: noderef.id,
                    env: runnable.env,
                    lib: runnable.lib
                  }, lib, `${graphid}__${n.id}__`, new Map(inputs.map(input => [input.edge.as, nodefn(input.node, graphid, args)]))))
                    .then(refBody => {
                      Object.entries(refBody._extern_args).forEach(e => _extern_args[`${graphid}${n.id}/ ${e[0]}`])
                      text += `
          function fn_${graphid}${n.id}() {
            ${inputs.map(input => 
    `let ${input.edge.as} = ${nodefn(input.node, graphid, args)};`
  ).join("\n")};
            
            ${refBody.text};
          }
                      `
                    })
                } else {
                  text += `function fn_${graphid}${n.id}(){\nreturn _lib.extern.parseValue.fn(${JSON.stringify(noderef.value)})}\n\n`
                }

                // for now just assuming everything is an arg of the last node out
                text += `return fn_${graphid}${runnable.fn}();`
              }), util.wrapPromise(undefined))
              .then(() => {
                return {baseArgs, text, _extern_args}
              })
          ).value
        }).value).value

export const parseValue = (value: any) => {
  if (typeof value !== "string") {
    return value
  }

  if(value === "undefined") {
    return undefined
  }

  if(typeof value === "string") {
    if (value.startsWith("\"") && value.endsWith("\"")) {
      return value.substring(1, value.length - 1)
    }

    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        return JSON.parse(value.replaceAll("'", "\""))
      } catch (e) {
        // non-empty
      }
    }

    if(value.startsWith("0x")) {
      const int = parseInt(value)
      if(!isNaN(int)) {
        return int
      }
    }

    if(value.match(/-?[0-9.]*/g)[0].length === value.length){
      const float = parseFloat(value)
      if (!isNaN(float)) {
        return float
      }
    }

    if (value === "false" || value === "true") {
      return value === "true"
    }

  }

  return value
}


export const create_fn = (runnable: ConstRunnable, lib: Lib) => {
  if(!runnable) return
  const {baseArgs, text, _extern_args} = graphToFnBody(runnable, lib)
  const fn = new Function("fnargs", "baseArgs", "_extern_args", "import_util", "_lib", text)

  return (args: Env | Args | Record<string, unknown>, ...rest) => {
    try {
      return fn(args ? isArgs(args) ? (resolve_args(args, lib, {}) as {value: any}).value : isEnv(args) ? (resolve_args(args.data, lib, {}) as {value: any}).value : Object.hasOwn(baseArgs, "args") ? {args: [args, ...rest]} : args : {}, baseArgs, _extern_args, util, lib.data)
    } catch (e) {
      console.error(e)
      throw new NodysseusError(nodysseus_get(runnable.env, "__graphid", lib).value + "/" + runnable.fn, `Error in generated function ${text}`)
    }
  }
}

export const now = (scale?: number) => performance.now() * (scale ?? 1)

export const expect = (a: any, b: any, value: string) => {
  if(a === b) return a 
  else {
    console.log("a:")
    console.log(a)
    console.log("b:")
    console.log(b)
    throw new Error(`${value}: Value a does not match value b`)
  }
}

export const memoryUnwrap = (value) => value?.__kind === "state" ? value.state : value?.__kind === "reference" ? value.value : value
export const memoryCacheOf = (recache: MemoryCache["recache"], value: MemoryCache["value"]): MemoryCache => new MemoryCache(recache, value)
export const bindMemoryCache = <T>(a: MemoryCache<T>) => <S>(fn: (a: T) => MemoryCache<S>): MemoryCache<S> => new MemoryCache(() => a.recache(), () => fn(a.value()).value())
