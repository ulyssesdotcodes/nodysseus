export type NodysseusNode = GraphNode | ScriptNode | ValueNode | RefNode;

type BaseNode = {id: string, name?: string, category?: string};
export type GraphNode = Graph & {value?: any, category?: string};
export type ScriptNode = BaseNode & {script: string};
export type ValueNode = BaseNode & {value?: any};
export type RefNode = BaseNode & {ref: string, value?: any}


export const isNodeValue = (n: NodysseusNode): n is ValueNode => n && !!(n as ValueNode).value
export const isNodeGraph = (n: NodysseusNode): n is GraphNode => n && !!(n as GraphNode).nodes
export const isNodeScript = (n: NodysseusNode): n is ScriptNode => n && !!(n as ScriptNode)?.script;
export const isNodeRef = (n: NodysseusNode): n is RefNode => n && !!(n as RefNode)?.ref;

export type Graph = {
  id: string,
  out?: string,
  name?: string,
  nodes: Record<string, NodysseusNode>,
  edges: Record<string, Edge>,
  edges_in: Record<string, Record<string, Edge>>
}

export type EdgesIn = Record<string, Record<string, Edge>>;

export type Edge = {
  to: string,
  from: string,
  as: string
}

export type Store<T> = {
  get: (id: string) => T | undefined;
  set: (id: string, data: T) => void;
  delete: (id: string) => void;
  clear: () => void;
  keys: () => Array<string>;
  undo?: false | ((id: string) => void);
  redo?: false | ((id: string) => void);
}

export type RefStore = Store<NodysseusNode | Promise<NodysseusNode>> & {
  add_node: (graphId: string, node: NodysseusNode) => void;
  add_nodes_edges: (graphId: string, nodes: [NodysseusNode], edges: [Edge], remove_edges: [Edge], remove_nodes: [NodysseusNode]) => void;
  remove_node: (graphId: string, node: NodysseusNode) => void;
  add_edge: (graphId: string, edge: Edge) => void;
  remove_edge: (graphId: string, edge: Edge) => void;
}

export type NodysseusStore = {
  refs: RefStore,
  parents: Store<{parent: string, parentest: string}>,
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

export type BaseRunnable = {
  __kind: unknown,
  fn: string,
  graph: Graph,
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
  outputs: {
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
  args: ConstRunnable,
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
export const isInputRunnable = (r: Runnable | InputRunnable) => !Object.hasOwn(r, "__kind") && Object.hasOwn(r, "fn") && Object.hasOwn(r, "graph")

export type Lib = {
  __kind: "lib",
  data: Record<string, any>
}

export const isLib = (lib: any) => lib?.__kind === "lib";

export type Env = {
  __kind: "env",
  data: Args,
  _output?: string, 
  env?: Env,
  node_id?: string,
}

export const isEnv = (env: any): env is Env => env?.__kind === "env"


//export const isApRunnable = (r: Runnable): r is ApRunnable => isGraphRunnable((r as ApRunnable).fn)

export type NodeArg = { exists: boolean, name: string } & Partial<FullyTypedArg>
 
export type Args = Map<string, ConstRunnable | Result>;
export type ResolvedArgs = Map<string, unknown>;
export const isArgs = (args: any): args is Args => typeof args?.get === "function"


export type RunOptions = {
  profile?: boolean,
  resolvePromises?: boolean,
  timings?: Record<string, number>;
}

type FullyTypedArg = { 
  type: string, 
  default?: boolean
  additionalArg?: boolean
}

export type TypedArg = string | FullyTypedArg
