export type NodysseusNode = GraphNode | ValueNode | RefNode;

type BaseNode = {id: string, name?: string, category?: string};
export type GraphNode = Graph & {value?: any, category?: string};
export type ValueNode = BaseNode & {value?: string};
export type RefNode = BaseNode & {ref: string, value?: string}


export const isNodeValue = (n: NodysseusNode): n is ValueNode => n && !!(n as ValueNode).value
export const isNodeGraph = (n: NodysseusNode): n is GraphNode => n && !!(n as GraphNode).nodes
export const isNodeRef = (n: NodysseusNode): n is RefNode => n && !!(n as RefNode)?.ref;

export const compareNodes = (a: NodysseusNode, b: NodysseusNode) => (console.log(a, b), a).id === b.id && a.name === b.name && 
  ((isNodeRef(a) && isNodeRef(b) && a.ref === b.ref && a.value === b.value) 
    || (isNodeGraph(a) && isNodeGraph(b) && a.nodes === b.nodes) 
    || (isNodeValue(a) && isNodeValue(b) && a.value === b.value)
  )

export type SavedGraph = {
  id: string,
  out?: string,
  name?: string,
  nodes: Record<string, NodysseusNode>,
  edges: Record<string, Edge>,
  description?: string
}

export type Graph = SavedGraph & {
  edges_in?: Record<string, Record<string, Edge>>,
}

export const isGraph = (graph: any): graph is Graph => graph && Object.hasOwn(graph, "nodes")
export const isEdgesInGraph = (graph: Graph | SavedGraph): graph is Graph => Object.hasOwn(graph, "edges_in")

export type EdgesIn = Record<string, Record<string, Edge>>;

export type Edge = EdgeNoAs & {as: string}

export type EdgeNoAs = {
  to: string,
  from: string
}

export type Store<T> = {
  get: (id: string) => T | undefined | Promise<T | undefined>;
  set: (id: string, data: T) => T | Promise<T>;
  delete: (id: string) => void;
  clear: () => void;
  keys: () => Array<string> | Promise<Array<string>>;
}

export type RefStore = Store<Graph> & {
  addFromUrl: (url: string) => Array<Graph> | Promise<Array<Graph>>;
  add_node: (graphId: string, node: NodysseusNode) => Graph | Promise<Graph>;
  add_nodes_edges: (updates: {
    graphId: string, 
    addedNodes?: NodysseusNode[], 
    addedEdges?: Edge[], 
    removedNodes?: NodysseusNode[], 
    removedEdges?: Array<{[k in Exclude<keyof Edge, "as">]: Edge[k]}>
  }) => Graph | Promise<Graph>;
  remove_node: (graphId: string, node: NodysseusNode) => Graph | Promise<Graph>;
  add_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
  remove_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
  undo?: false | ((id: string) => undefined | Graph | Promise<Graph>);
  redo?: false | ((id: string) => undefined | Graph | Promise<Graph>);
}

export type StoreType<T extends Store<any>> = Exclude<ReturnType<T["get"]>, undefined | Promise<any>>;
export type NodysseusStoreTypes = {[k in keyof NodysseusStore]: StoreType<NodysseusStore[k]>}

export type NodysseusStore = {
  refs: RefStore,
  parents: Store<{parent: string, parentest: string, nodeRef?: string}>,
  state: Store<any>,
  persist: Store<any>,
  fns: Store<{script: string, fn: Function}>,
  assets: Store<Blob>
}

export type LokiT<T> = {
  id: string,
  data: T
}

type NonErrorResult = { __kind: "result", value: any };

export type Result = NonErrorResult | Error
export const isResult = (r: any): r is NonErrorResult => r.__kind === "result";

export type BaseRunnable = {
  __kind: unknown,
  fn: string,
  graph: string | Graph,
  env: Env,
  lib: Lib,
}

export type InputRunnable = Omit<BaseRunnable, "__kind" | "env" | "lib"> & {
  env?: Env,
  lib?: Lib
};

export const AP = "ap"
export type ApFunction = {
  __kind: "apFunction",
  fn: Function,
  args: Array<string>,
  promiseArgs?: boolean,
  rawArgs?: boolean
  outputs?: {
    lib?: boolean,
    display?: boolean,
  }
}
export const isApFunction = (a: any): a is ApFunction => a && (a as ApFunction).__kind === "apFunction";

export type ApFunctorLike = FunctorRunnable | ApRunnable | ApFunction | Function;

export const isApFunctorLike = (a: any) => !!a && (typeof a === "function" || isApFunction(a) || isApRunnable(a) || isFunctorRunnable(a))

export type ApRunnable = {
  __kind: "ap",
  fn: ApFunctorLike | Array<ApFunctorLike>
  args: ConstRunnable | Env,
  lib: Lib
}


export const CONST = "const"
export type ConstRunnable = BaseRunnable & {
  __kind: "const"
}

export const FUNCTOR = "functor"
export type FunctorRunnable = BaseRunnable & {
  __kind: "functor",
  parameters: Array<string>
}

export type Runnable =  Result | ApRunnable | FunctorRunnable | ConstRunnable


export const isRunnable = (r: any): r is Runnable => isValue(r as Runnable) || isConstRunnable(r as Runnable) || isApRunnable(r as Runnable) || isFunctorRunnable(r as Runnable);
export const isError = (r: any): r is Error => r instanceof Error;
export const isValue = (r: Runnable): r is NonErrorResult => {
  const result = r as Result;
  return !isError(result) && (result)?.__kind === "result";
}
export const isConstRunnable = (r: Runnable): r is ConstRunnable => !(r instanceof Error) && r?.__kind == CONST;
export const isApRunnable = (r: Runnable): r is ApRunnable => !(r instanceof Error) && r?.__kind == AP;
export const isFunctorRunnable = (r: Runnable): r is FunctorRunnable => !(r instanceof Error) && r?.__kind == FUNCTOR;
export const isInputRunnable = (r: Runnable | InputRunnable): r is InputRunnable => !Object.hasOwn(r, "__kind") && Object.hasOwn(r, "fn") && Object.hasOwn(r, "graph")
export const getRunnableGraph = (r: Runnable | InputRunnable, lib: Lib): Graph => typeof (r as BaseRunnable).graph === "string" ? lib.data.no.runtime.get_ref((r as BaseRunnable).graph) : (r as BaseRunnable).graph;
export const getRunnableGraphId = (r: Runnable | InputRunnable, lib: Lib): string => typeof (r as BaseRunnable).graph === "string" ? ((r as BaseRunnable).graph as string) : ((r as BaseRunnable).graph as Graph).id; 

export type Lib = {
  __kind: "lib",
  data: Record<string, any>
}

export const isLib = (lib: any): lib is Lib => lib?.__kind === "lib";

export type Env = {
  __kind: "env",
  data: Args,
  _output?: string, 
  env?: Env,
  node_id?: string,
}

export const isEnv = (env: any): env is Env => env?.__kind === "env"


//export const isApRunnable = (r: Runnable): r is ApRunnable => isGraphRunnable((r as ApRunnable).fn)

// TODO: type this better
export type Extern = {
  args: Array<string | FullyTypedArg> | Record<string, string | FullyTypedArg>,
  fn: Function
}
export type NodeArg = { 
  exists: boolean, 
  name: string 
} & Partial<FullyTypedArg>
 
export type Args = Map<string, ConstRunnable | Result>;
export type ResolvedArgs = Map<string, unknown>;
export const isArgs = (args: any): args is Args => typeof args?.get === "function"


export type RunOptions = {
  profile?: boolean,
  resolvePromises?: boolean,
  timings?: Record<string, number>;
}

type _BaseFullyTypedArg = { 
  type: string | Record<string, string | FullyTypedArg | ((graph: Graph, nodeId: string) => FullyTypedArg)>
  default?: boolean
  additionalArg?: boolean
  local?: boolean
}

type _RunnableTypedArg = _BaseFullyTypedArg & {
  type: "@flow.runnable",
  runnableParameters: Array<string>
}


export type FullyTypedArg = _BaseFullyTypedArg | _RunnableTypedArg;

export const isRunnableTypedArg = (a: FullyTypedArg): a is _RunnableTypedArg => a.type === "@flow.runnable"

export type TypedArg = string | FullyTypedArg
export const isTypedArg = (a: any): a is TypedArg => a && (typeof a === "string" || typeof a.type === "string" || typeof a.type === "object");

export type NodeMetadata = {
  parameters?: Array<string>,
  values?: Array<string>,
  dataLabel?: string,
  language?: "javascript" | "json" | "markdown" | false
}

export type MemoryState = {__kind: "state", id: string, set: ApFunction, state: any}
export type MemoryReference = {__kind: "reference", id: string, set: ApFunction, value: any}

export type Memory = MemoryState | MemoryReference;
export const isMemory = (v: any) => v && typeof v === "object" && (v.__kind === "state" || v.__kind === "reference")
