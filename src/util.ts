import { Edge, Graph, GraphNode, NodysseusNode, isNodeRef, isNodeGraph, isNodeValue, NodeArg, Runnable, isEnv, isRunnable, isValue, Lib, isLib, Env, Args, ValueNode, Result, isArgs, isConstRunnable, isApRunnable, isError, ConstRunnable } from "./types";

export const WRAPPED_KIND = "wrapped";
type WrappedKind = "wrapped";

export const ispromise = <T>(a: any): a is Promise<T> => a && typeof a.then === 'function' && !isWrappedPromise(a);
export const isWrappedPromise = <T>(a: any): a is WrappedPromise<T> => a && a.__kind === WRAPPED_KIND;
export const isgraph = g => g && g.out !== undefined && g.nodes !== undefined && g.edges !== undefined


export type WrappedPromise<T> = {
  __kind: WrappedKind,
  then: <S>(fn: (t: FlattenPromise<T>) => S) => WrappedPromise<S>,
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
    
    throw e;
  }
}

export const wrapPromise = <T>(t: T, c?: <E extends Error, S>(fn: (e?: E) => S) => S): WrappedPromise<FlattenWrappedPromise<T>> => 
  (isWrappedPromise(t) ? t
    : {
      __kind: WRAPPED_KIND,
      then: <S>(fn: (t: FlattenPromise<T>) => S) => wrapPromise(ispromise(t) 
        ? c ? t.then(fn as (value: unknown) => S | PromiseLike<S>).catch(c)
          : t.then(fn as (value: unknown) => S | PromiseLike<S>) 
        : tryCatch(fn, t, c)),
      value: t
    }) as WrappedPromise<FlattenWrappedPromise<T>>

export const wrapPromiseAll = (wrappedPromises: Array<WrappedPromise<any>>): WrappedPromise<Array<any> | Promise<Array<any>>> => {
  const hasPromise = wrappedPromises.reduce((acc, wrappedPromise) => acc || ispromise(wrappedPromise.value), false)
  return wrapPromise(hasPromise ? Promise.all(wrappedPromises.map(wp => Promise.resolve(wp.value)))
    : wrappedPromises.map(wp => wp.value));
}

// type MaybePromiseFn<T, S> = T extends Promise<infer Item> ? ((i: Item) => S) : ((i: T) => S);
// export function mapMaybePromise<T, S>(a: Promise<T>, fn: (t: T) => S): Promise<S>;
// export function mapMaybePromise<T, S>(a: T, fn: (t: T) => S): S;
// declare function mapMaybePromise<T, S>(a: T | Promise<T>, fn: (t: T) => S): S | Promise<S>;
// export function mapMaybePromise<T, S>(a: Promise<T> | T, fn: (t: T) => S) { return ispromise(a) ? a.then(fn) : fn(a) }
export type IfPromise<T, S> = T extends Promise<infer _> ? S : Promise<S>;
export type FlattenPromise<T> = T extends Promise<infer Item> ? Item : T;
export const mapMaybePromise = <T, S>(a: T, fn: (t: FlattenPromise<T>) => S): IfPromise<T, S> => (ispromise(a) ? a.then(fn as (value: unknown) => S | PromiseLike<S>) : (fn(a as FlattenPromise<T>))) as IfPromise<T, S>

export const base_node = node => node.ref || node.extern ? ({id: node.id, value: node.value, name: node.name, ref: node.ref}) : base_graph(node);
export const base_graph = graph => ({id: graph.id, value: graph.value, name: graph.name, nodes: graph.nodes, edges: graph.edges, edges_in: graph.edges_in, out: graph.out})

export const create_randid = () => Math.random().toString(36).substring(2, 9);
type FlattenedGraph = {flat_nodes: Record<string, NodysseusNode>, flat_edges: Record<string, Edge>};
const isFlattenedGraph = (g: NodysseusNode | FlattenedGraph): g is FlattenedGraph => !!(g as FlattenedGraph).flat_nodes;
export const flattenNode = (graph: NodysseusNode, levels = -1): FlattenedGraph | NodysseusNode =>
    !isNodeGraph(graph) || !graph.nodes || levels <= 0
    ? graph
    : Object.values(graph.nodes)
        .map(g => flattenNode(g as GraphNode, levels - 1))
        .reduce((acc: {flat_nodes: Record<string, NodysseusNode>, flat_edges: Record<string, Edge>}, n) => isFlattenedGraph(n) ? Object.assign({}, acc, {
            flat_nodes: Object.assign(acc.flat_nodes, Object.fromEntries(Object.values(n.flat_nodes).map(fn => {
                // adjust for easy graph renaming
                if ((fn.id === (graph.out || "out")) && graph.name) {
                    fn.name = graph.name;
                }
                return [fn.id, fn]
            }))),
            flat_edges: Object.assign(acc.flat_edges, n.flat_edges)
        }) : acc, {
            flat_nodes: graph.nodes,
            flat_edges: graph.edges
        });


export const expand_node = (data: {nolib: Record<string, any>, node_id: string, display_graph: Graph}): {display_graph: Graph, selected: Array<string>} => {
    const nolib = data.nolib;
    const node_id = data.node_id;
    const node: NodysseusNode = data.display_graph.nodes[node_id]

    if (!isNodeGraph(node)) {
        console.log('no nodes?');
        return { display_graph: data.display_graph, selected: [data.node_id] };
    }

    const args_node = Object.values(node.edges).find(e => e.to === node.out && e.as === "args")?.from;
    const in_edges = nolib.no.runtime.get_edges_in(data.display_graph.id, node_id);

    const flattened = flattenNode(node, 1);

    const new_id_map = isFlattenedGraph(flattened) ? Object.values(flattened.flat_nodes).reduce((acc, n) => nolib.no.runtime.get_node(data.display_graph, n.id) ? (acc[n.id] = create_randid(), acc) : n, {} as Record<string, any>) : flattened

    isFlattenedGraph(flattened) && Object.values(flattened.flat_nodes).forEach(n => nolib.no.runtime.add_node(data.display_graph, n, nolib))
    isFlattenedGraph(flattened) && nolib.no.runtime.update_edges(data.display_graph, Object.values(flattened.flat_edges).concat(in_edges.map((e: Edge) => ({...e, to: args_node}))), in_edges)

    return { display_graph: data.display_graph, selected: [new_id_map[node.out ?? "out"] ?? node.out ?? 'out'] };
}

export const contract_node = (data: {display_graph: Graph, node_id: string, nolib: any}, keep_expanded = false) => {
    const nolib = data.nolib;
    const node = data.display_graph.nodes[data.node_id];
    const node_id = data.node_id;
    if (!isNodeGraph(node)) {
        const inside_nodes: Array<NodysseusNode> = [Object.assign({}, node)];
        const inside_node_map = new Map();
        inside_node_map.set(inside_nodes[0].id, inside_nodes[0]);
        const inside_edges = new Set<Edge>();

        const q = nolib.no.runtime.get_edges_in(data.display_graph.id, inside_nodes[0].id)

        let in_edge: Array<Edge> = [];
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
            let inside_node = old_node || Object.assign({}, data.display_graph.nodes[e.from]);

            inside_node_map.set(inside_node.id, inside_node);
            inside_edges.add(e);
            if (!old_node) {
                inside_nodes.push(inside_node);
            }

            if (!args_edge || e.from !== args_edge.from) {
                nolib.no.runtime.get_edges_in(data.display_graph, e.from).forEach((de: Edge) => q.push(de));
            }
        }

        let args_node_id = args_edge ? args_edge.from : undefined;

        // just return the original graph if it's a single node 
        if (in_edge.find(ie => ie.to !== args_node_id) || inside_nodes.length < 2) {
            return { display_graph: data.display_graph, selected: [data.node_id] };
        }

        const out_node_id = data.node_id;

        let node_id_count = data.display_graph.nodes[node_id] ? 1 : 0;
        let final_node_id = node_id_count === 1 ? node_id : `${node_id}_${node_id_count}`

        const edges: Record<string, Edge> = {};
        for (const e of inside_edges) {
          const from = e.from.startsWith(node_id + "/")
                    ? e.from.substring(node_id.length + 1)
                    : e.from;
            edges[from] = {
                ...e,
                from,
                to: e.to.startsWith(node_id + "/")
                    ? e.to.substring(node_id.length + 1)
                    : e.to
            };
        }

        const new_display_graph = {
          ...data.display_graph,
            nodes: data.display_graph.nodes,
            edges: data.display_graph.edges
        };

        for(const newn of inside_node_map.keys()) {
          nolib.no.runtime.delete_node(data.display_graph.id, newn, nolib, false)
        }

        nolib.no.runtime.add_node(data.display_graph.id, {
            id: final_node_id,
            name: node.name ?? (isNodeValue(node) ? node.value : undefined),
            out: out_node_id.startsWith(node_id + '/') ? out_node_id.substring(node_id.length + 1) : out_node_id,
            nodes: Object.fromEntries(inside_nodes.map(n => [n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id, {
                ...n,
                id: n.id.startsWith(node_id + "/") ? n.id.substring(node_id.length + 1) : n.id
            }])),
            edges
        })

        const edgesToRemove: Array<Edge> = [];
        const edgesToAdd: Array<Edge> = [];

        Object.values(data.display_graph.edges).forEach(e => {
            if(inside_node_map.has(e.from) && inside_node_map.has(e.to)) {
              edgesToRemove.push(e)
            } else if(e.from === data.node_id) {
              edgesToAdd.push({...e, from: final_node_id})
            } else if (e.to === args_node_id) {
              edgesToAdd.push({...e, to: final_node_id})
            }
        })

        nolib.no.runtime.update_edges(data.display_graph.id, edgesToAdd, edgesToRemove, nolib)

        return { display_graph: { ...data.display_graph, ...new_display_graph }, selected: [final_node_id] };
    }
}



export const ancestor_graph = (node_id: string, from_graph: Graph, nolib: Record<string, any>): Graph => {
    let edges_in;
    let queue = [node_id];
    const graph: Graph = {...from_graph, nodes: {}, edges: {}};
    while(queue.length > 0) {
        let node_id = queue.pop();
        graph.nodes[node_id] = ({...nolib.no.runtime.get_node(from_graph, node_id)})
        edges_in = nolib.no.runtime.get_edges_in(from_graph, node_id);
        graph.edges = Object.assign(graph.edges, Object.fromEntries(edges_in.map(e => [e.from, e])));
        edges_in.forEach(e => queue.push(e.from));
    }
    return graph;
}

export const node_args = (nolib: Record<string, any>, graph: Graph, node_id): Array<NodeArg> => {
    const node = nolib.no.runtime.get_node(graph, node_id);
    if(!node) {
        // between graph update and simulation update it's possible links are bad
        return []
    }
    const node_ref = node?.ref ? nolib.no.runtime.get_ref(node.ref) : node;
    const edges_in = node_ref && nolib.no.runtime.get_edges_in(graph, node_id);
    const edge_out = nolib.no.runtime.get_edge_out(graph, node_id)
    const node_out = edge_out && edge_out.as === "args" && nolib.no.runtime.get_node(graph, edge_out.to);
    const node_out_args = node_out?.ref === "runnable" && 
      Object.values(ancestor_graph(node_out.id, graph, nolib).nodes).filter(isNodeRef).filter(n => n.ref === "arg").map(a => a.value?.includes(".") ? a.value?.substring(0, a.value?.indexOf(".")) : a.value);

    // const argslist_path = node_ref?.nodes && nolib.no.runtime.get_path(node_ref, "argslist");

    const nextIndexedArg = "arg" + ((
        edges_in?.filter(l => l.as?.startsWith("arg") && new RegExp("[0-9]+").test(l.as.substring(3)))
                .map(l => parseInt(l.as.substring(3))) ?? [])
            .reduce((acc, i) => acc > i ? acc : i + 1, 0))
    
    const externfn = node_ref?.ref === "extern" && nolib.extern.get.fn({}, nolib, node_ref?.value, undefined, undefined, nolib)
    const baseargs = externfn
            ? externfn.args
              ? externfn.args
              : ['args']
            : isNodeGraph(node_ref)
            ? Object.values(node_ref?.nodes).filter(isNodeRef).filter(n => 
                n.ref === "arg" 
                && !n.value?.split(":")[1]?.toLowerCase()?.includes("internal"))
                .map(n => n.value).filter(a => a) ?? []
            : []

    return [...new Set(baseargs
        .filter(a => !a.includes('.') && !a.startsWith("_"))
        .concat(edges_in?.map(e => e.as) ?? [])
        .concat(
            (externfn?.args?.includes("_node_args") || baseargs.includes("_args"))
            || (node.ref === undefined && !node.value)
            ? [nextIndexedArg]
            : []
        )
        .concat(node_out_args ? node_out_args : []))
    ].map((a: string) => ({exists: !!edges_in.find(e => e.as === a), name: a}))
}


/*
 * Type utils
 */

export const newEnv = (data: Args, _output?, env?: Env): Env => 
  ({__kind: "env", data: data?.size > 0 ? env?.data?.size ? new Map([...env.data, ...data]) : data : new Map(), _output, env: env?.env})
export const combineEnv = (data: Args, env: Env, node_id?: string, _output?: string): Env => {
  if(isEnv(data)) {
    throw new Error("Can't create an env with env data")
  }
  if(!data.has("__graphid")) {
    data.set("__graphid", env.data.get("__graphid"))
  }
  return ({__kind: "env", data, env, node_id, _output})
}

export const mergeEnv = (data: Args, env: Env): Env => {
  if(isRunnable(data)) {
    throw new Error("Can't merge a runnable")
  }

  // Has to be .has because we want to preserve "_output" being set to undefined
  const _output: false | Result | ConstRunnable = data.has("_output") ? data.get("_output") : false;

  return data.size > 0 ? {
  __kind: "env", 
    data: env?.data?.size > 0 ? new Map([...env.data, ...data, ["_output", undefined]]) : data.has("_output") ? new Map([...data]) : data, 
    env: env.env, 
    _output: _output === false ? env._output : isValue(_output) ? _output.value : data.get("_output")
  } : env;
}

export const newLib = (data): Lib => ({__kind: "lib", data})
export const mergeLib = (a: Record<string, any> | Lib, b: Lib): Lib => (a ? {
  __kind: "lib",
  data: Object.assign({}, isLib(a) ? isArgs(a.data) ? Object.fromEntries(a.data) : a.data : isArgs(a) ? Object.fromEntries(a) : a, b.data)
}: b)

export const runnableId = (runnable: Runnable) => isConstRunnable(runnable) ? `${runnable.graph.id}/${runnable.fn}` : false;
