import { Edge, Graph, GraphNode, NodysseusNode, isNodeRef, isNodeGraph, isNodeValue, NodeArg, Runnable, isEnv, isRunnable, isValue, Lib, isLib, Env, Args, ValueNode, Result, isArgs, isConstRunnable, isApRunnable, isError, ConstRunnable, TypedArg, SavedGraph, isEdgesInGraph, FullyTypedArg } from "./types.js"

export const WRAPPED_KIND = "wrapped"
type WrappedKind = "wrapped";

export const ispromise = <T>(a: any): a is Promise<T> => a && typeof a.then === "function" && !isWrappedPromise(a)
export const isWrappedPromise = <T>(a: any): a is WrappedPromise<T> => a && a.__kind === WRAPPED_KIND
export const isgraph = g => g && g.out !== undefined && g.nodes !== undefined && g.edges !== undefined


export type WrappedPromise<T> = {
  __kind: WrappedKind,
  then: <S>(fn: (t: FlattenPromise<T>) => S | WrappedPromise<S>) => WrappedPromise<S>,
  value: T,
}

type FlattenWrappedPromise<T> = T extends WrappedPromise<infer Item> ? Item : T

const tryCatch = (fn, t, c) => {
  try {
    return fn(t)
  } catch(e) {
    if(c){
      return wrapPromise(c(e))
    }
    
    throw e
  }
}

export const wrapPromise = <T, S>(t: T | PromiseLike<T>, c?: <E extends Error>(e?: E) => S): WrappedPromise<FlattenWrappedPromise<T>> => 
  (isWrappedPromise(t) ? t
  : {
    __kind: WRAPPED_KIND,
    then: <S>(fn: (tt: FlattenPromise<typeof t>) => S | WrappedPromise<S>) => wrapPromise(ispromise(t) 
      ? c ? t.then(fn as (value: unknown) => S | PromiseLike<S> | WrappedPromise<S>).then(v => isWrappedPromise(v) ? v.value : v).catch(c)
      : t.then(fn as (value: unknown) => S | PromiseLike<S> | WrappedPromise<S>).then(v => isWrappedPromise(v) ? v.value : v)
      : tryCatch(fn, t, c), c),
    value: t
  }) as WrappedPromise<FlattenWrappedPromise<T>>

export const wrapPromiseAll = <T>(wrappedPromises: Array<WrappedPromise<T> | T>, c?: <E extends Error>(e: E) => T): WrappedPromise<Array<any> | Promise<Array<any>>> => {
  const hasPromise = wrappedPromises.reduce((acc, wrappedPromise) => acc || ispromise(isWrappedPromise(wrappedPromise) ? wrappedPromise.value : wrappedPromise), false)
  return wrapPromise(hasPromise ? Promise.all(wrappedPromises.map(wp => Promise.resolve(isWrappedPromise(wp) ? wp.value : wp)))
    : wrappedPromises.map(wp => isWrappedPromise(wp) ? wp.value : wp), c)
}

export const wrapPromiseReduce = (previousValue, arr, fn, index) => 
  wrapPromise(fn({previousValue, currentValue: arr[index], index}))
    .then(acc => index < arr.length - 1 ? wrapPromiseReduce(acc, arr, fn, index + 1) : acc);

// type MaybePromiseFn<T, S> = T extends Promise<infer Item> ? ((i: Item) => S) : ((i: T) => S);
// export function mapMaybePromise<T, S>(a: Promise<T>, fn: (t: T) => S): Promise<S>;
// export function mapMaybePromise<T, S>(a: T, fn: (t: T) => S): S;
// declare function mapMaybePromise<T, S>(a: T | Promise<T>, fn: (t: T) => S): S | Promise<S>;
// export function mapMaybePromise<T, S>(a: Promise<T> | T, fn: (t: T) => S) { return ispromise(a) ? a.then(fn) : fn(a) }
export type IfPromise<T, S> = T extends Promise<infer _> ? S : Promise<S>;
export type FlattenPromise<T> = T extends Promise<infer Item> ? Item : T;



export class NodysseusError extends Error {
  cause: {node_id: string}
  constructor(node_id, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodysseusError)
    }

    this.cause = {node_id}
  }
}


export const base_node = node => node.ref || node.extern ? ({id: node.id, value: node.value, name: node.name, ref: node.ref}) : base_graph(node)
export const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, edges_in: graph.edges_in, out: graph.out, description: graph.description})

export const create_randid = (graph: Graph) => {
  const randstr = Math.random().toString(36)
  const i = 2
  let randid
  do {
    randid = randstr.substring(i, i + 7)
  } while(graph.nodes[randid])

  return randid
}

type FlattenedGraph = {flat_nodes: Record<string, NodysseusNode>, flat_edges: Record<string, Edge>};
const isFlattenedGraph = (g: NodysseusNode | FlattenedGraph): g is FlattenedGraph => !!(g as FlattenedGraph).flat_nodes
export const flattenNode = (graph: NodysseusNode, levels = -1): FlattenedGraph | NodysseusNode =>
  !isNodeGraph(graph) || !graph.nodes || levels <= 0
    ? graph
    : Object.values(graph.nodes)
      .map(g => flattenNode(g as GraphNode, levels - 1))
      .reduce((acc: {flat_nodes: Record<string, NodysseusNode>, flat_edges: Record<string, Edge>}, n) => isFlattenedGraph(n) ? Object.assign({}, acc, {
        flat_nodes: Object.assign(acc.flat_nodes, Object.fromEntries(Object.values(n.flat_nodes).map(fn => {
          // adjust for easy graph renaming
          if ((fn.id === (graph.out || "out")) && graph.name) {
            fn.name = graph.name
          }
          return [fn.id, fn]
        }))),
        flat_edges: Object.assign(acc.flat_edges, n.flat_edges)
      }) : acc, {
        flat_nodes: graph.nodes,
        flat_edges: graph.edges
      })


export const expand_node = (data: {nolib: Record<string, any>, node_id: string, editingGraph: Graph}): {editingGraph: Graph, selected: Array<string>} => {
  const nolib = data.nolib
  const node_id = data.node_id
  const node: NodysseusNode = data.editingGraph.nodes[node_id]

  if (!isNodeGraph(node)) {
    console.log("no nodes?")
    return { editingGraph: data.editingGraph, selected: [data.node_id] }
  }

  const args_node = Object.values(node.edges).find(e => e.to === node.out && e.as === "args")?.from
  const in_edges = nolib.no.runtime.get_edges_in(data.editingGraph, node_id)

  const flattened = flattenNode(node, 1)

  const new_id_map = isFlattenedGraph(flattened) ? Object.values(flattened.flat_nodes).reduce((acc, n) => nolib.no.runtime.get_node(data.editingGraph, n.id) ? (acc[n.id] = create_randid(data.editingGraph), acc) : n, {} as Record<string, any>) : flattened

  isFlattenedGraph(flattened) && nolib.no.runtime.add_nodes_edges(data.editingGraph.id, Object.values(flattened.flat_nodes).map(n => ({...n, id: new_id_map[n.id] ?? n.id})), Object.values(flattened.flat_edges).concat(in_edges.map((e: Edge) => ({...e, to: new_id_map[args_node] ?? args_node}))).concat([{...data.editingGraph.edges[node_id], from: node.out}]).map(e => ({...e, from: new_id_map[e.from] ?? e.from, to: new_id_map[e.to] ?? e.to})), in_edges.concat([data.editingGraph.edges[node_id]]), [node_id], nolib)

  return { editingGraph: data.editingGraph, selected: [new_id_map[node.out ?? "out"] ?? node.out ?? "out"] }
}

export const contract_node = (data: {editingGraph: Graph, node_id: string, nolib: any}, keep_expanded = false) => {
  const nolib = data.nolib
  const node = data.editingGraph.nodes[data.node_id]
  const node_id = data.node_id
  if (!isNodeGraph(node)) {
    const inside_nodes: Array<NodysseusNode> = [Object.assign({}, node)]
    const inside_node_map = new Map()
    inside_node_map.set(inside_nodes[0].id, inside_nodes[0])
    const inside_edges = new Set<Edge>()

    const q = nolib.no.runtime.get_edges_in(data.editingGraph, inside_nodes[0].id)

    let in_edge: Array<Edge> = []
    let args_edge

    while (q.length > 0) {
      const e = q.shift()

      if(e.to === node.id && e.as === "args") {
        args_edge = e
      }

      in_edge.filter(ie => ie.from === e.from).forEach(ie => {
        inside_edges.add(ie)
      })
      in_edge = in_edge.filter(ie => ie.from !== e.from)

      const old_node = inside_nodes.find(i => e.from === i.id)
      const inside_node = old_node || Object.assign({}, data.editingGraph.nodes[e.from])

      inside_node_map.set(inside_node.id, inside_node)
      inside_edges.add(e)
      if (!old_node) {
        inside_nodes.push(inside_node)
      }

      if (!args_edge || e.from !== args_edge.from) {
        nolib.no.runtime.get_edges_in(data.editingGraph, e.from).forEach((de: Edge) => q.push(de))
      }
    }

    const args_node_id = args_edge ? args_edge.from : undefined

    // just return the original graph if it's a single node 
    if (in_edge.find(ie => ie.to !== args_node_id) || inside_nodes.length < 2) {
      return { editingGraph: data.editingGraph, selected: [data.node_id] }
    }

    const out_node_id = data.node_id

    const node_id_count = data.editingGraph.nodes[node_id] ? 1 : 0
    const final_node_id = node_id_count === 1 ? node_id : `${node_id}_${node_id_count}`

    const edges: Record<string, Edge> = {}
    for (const e of inside_edges) {
      const from = e.from.startsWith(node_id + "/")
        ? e.from.substring(node_id.length + 1)
        : e.from
      edges[from] = {
        ...e,
        from,
        to: e.to.startsWith(node_id + "/")
          ? e.to.substring(node_id.length + 1)
          : e.to
      }
    }

    const edgesToRemove: Array<Edge> = []
    const edgesToAdd: Array<Edge> = [
      {...nolib.no.runtime.get_edge_out(data.editingGraph, data.node_id), from: final_node_id}, 
      ...nolib.no.runtime.get_edges_in(data.editingGraph, args_node_id).map(e => ({...e, to: final_node_id}))
    ]

    // Iterate inside nodes to find edges
    for(const newn of inside_node_map.keys()) {
      nolib.no.runtime.get_edges_in(data.editingGraph, newn)
        .filter(e => inside_node_map.has(e.from))
        .forEach(e => edgesToRemove.push(e))
    }

    nolib.no.runtime.add_nodes_edges(data.editingGraph.id, [{
      id: final_node_id,
      name: node.name ?? (isNodeValue(node) ? node.value : undefined),
      out: out_node_id.startsWith(node_id + "/") ? out_node_id.substring(node_id.length + 1) : out_node_id,
      nodes: Object.fromEntries(inside_nodes.map(n => [n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id, {
        ...n,
        id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
      }])),
      edges
    }], edgesToAdd, edgesToRemove, [...inside_node_map.values()])

    return { selected: [final_node_id] }
  }
}


export const parseArg = (arg: string): FullyTypedArg & {name: string} => {
  let nodevalue, valuetype;
  const colonIdx = arg.indexOf(":")
  if(colonIdx >= 0) {
    nodevalue = arg.substring(0, colonIdx)
    valuetype = arg.substring(colonIdx + 2)
  } else {
    nodevalue = arg;
  }
  return {
    type: valuetype !== "default" ? valuetype : "any",
    name: nodevalue,
    default: valuetype === "default",
  }
}


export const ancestor_graph = (node_id: string, from_graph: Graph | SavedGraph, nolib?: Record<string, any>): Graph => {
  let edges_in = []
  const fromGraphEdges = Object.values(from_graph.edges)
  const queue = [node_id]
  const graph: Graph = {...from_graph, nodes: {}, edges: {}, edges_in: {}}
  while(queue.length > 0) {
    const node_id = queue.pop()
    graph.nodes[node_id] = {...from_graph.nodes[node_id]}
    edges_in = (isEdgesInGraph(from_graph) && from_graph.edges_in[node_id]
      ? Object.values(from_graph.edges_in[node_id])
      : fromGraphEdges.filter(e => e.to === node_id))
      .filter(e => from_graph.nodes[e.from] && !graph.nodes[e.from])
    graph.edges = Object.assign(graph.edges, Object.fromEntries(edges_in.map(e => [e.from, e])))
    graph.edges_in[node_id] = Object.fromEntries(edges_in.map(e => [e.from, e]))
    edges_in.forEach(e => queue.push(e.from))
  }
  return graph
}

export const descendantGraph = <T>(nodeId: string, graph: Graph, traverse: (nodeId: string, edgeIn: Edge) => T): Record<string, T> => 
  graph.edges[nodeId] ? {
    [graph.edges[nodeId].to]: traverse(graph.edges[nodeId].to, graph.edges[nodeId]), 
    ...descendantGraph(graph.edges[nodeId].to, graph, traverse)
  } : {}

/*
 * Type utils
 */

export const newEnv = (data: Args, _output?, env?: Env): Env => 
  ({__kind: "env", data: data?.size > 0 ? env?.data?.size ? new Map([...env.data, ...data]) : data : new Map(), _output, env: env?.env})
export const combineEnv = (data: Args, env: Env, node_id?: string, _output?: string): Env => {
  if(isEnv(data)) {
    throw new Error("Can't create an env with env data")
  }
  if(!data?.has("__graphid")) {
    data.set("__graphid", env.data.get("__graphid"))
  }
  return ({__kind: "env", data, env, node_id, _output})
}

export const mergeEnv = (data: Args, env: Env): Env => {
  if(isRunnable(data)) {
    throw new Error("Can't merge a runnable")
  }

  // Has to be .has because we want to preserve "_output" being set to undefined
  const _output: false | Result | ConstRunnable = isArgs(data) && data.has("_output") ? data.get("_output") : false

  return data.size > 0 ? {
    __kind: "env", 
    data: env?.data?.size > 0 ? new Map([...env.data, ...data, ["_output", undefined]]) : data.has("_output") ? new Map([...data]) : data, 
    env: env.env, 
    _output: _output === false ? env._output : isValue(_output) ? _output.value : data.get("_output")
  } : env
}

export const newLib = (data): Lib => ({__kind: "lib", data})
export const mergeLib = (a: Record<string, any> | Lib, b: Lib): Lib => (a ? {
  __kind: "lib",
  // data: a.data && b.data && a.data !== b.data ? mergeDeep(a.data, b.data) : a.data ?? b.data
  data: a.data && b.data && a.data !== b.data ? {...b.data, ...a.data, extern: {...a.data.extern, ...b.data.extern}} : a.data ?? b.data
}: b)

const MERGE_KEYS = ["extern"]

const mergeDeep = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  return aKeys.concat(bKeys).reduce((acc, key) => acc[key]
    ? acc 
    : a[key] === b[key]
      ? (acc[key] = a[key], acc)
      : {...acc, [key]: 
      MERGE_KEYS.includes(key) && typeof a[key] === "object" && typeof b[key] === "object"
        ? mergeDeep(a[key] as Record<string, unknown>, b[key] as Record<string, unknown>) 
        : a[key] ?? b[key]
      },
  {}
  )
}

export const runnableId = (runnable: Runnable) => isConstRunnable(runnable) ? `${runnable.graph}/${runnable.fn}` : false


const emptySet = new Set<string>();
export function compareObjects(value1, value2, isUpdate = false, excludedFields: Set<string> = emptySet) {
  const keys1 = Object.keys(value1)
  const keys2 = !isUpdate && Object.keys(value2)

  if (!isUpdate && keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if(excludedFields.has(key))
      continue
    if (value1[key] === value2[key]) {
      continue
    }

    return false
  }

  return true
}

export function set_mutable(obj, propsArg, value) {
  let props, lastProp
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
  lastProp = props.pop()
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

export const bfs = (graph: Graph, fn) => {
  const visited = new Set()
  const iter = (id, level) => {
    if (visited.has(id)) {
      return
    }

    fn(id, level)

    visited.add(id)

    for (const e of Object.values(graph.edges)) {
      if (e.to === id) {
        iter(e.from, level + 1)
      }
    }
  }

  return iter
}



export const handleError = (e, lib, graph, node, graphid) => {
  console.error("error in node")
  if (e instanceof AggregateError) {
    e.errors.map(console.error)
  } else {
    console.error(e)
  }
  if(e instanceof NodysseusError) {
    lib.data.no.runtime.publish("grapherror", e)
    return e
  }
  const parentest = lib.data.no.runtime.get_parentest(graph)
  const error_node = parentest ? graph : node
  lib.data.no.runtime.publish("grapherror", new NodysseusError(
    graphid + "/" + error_node.id, 
    e instanceof AggregateError ? "Error in node chain" : e
  ))

  return e
}

export const appendGraphId = (graphId: string, nodeId: string) => `${graphId}/${nodeId}`


