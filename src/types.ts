import { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export type Node = GraphNode | ScriptNode | ValueNode | RefNode;

type BaseNode = {id: string, name?: string};
export type GraphNode = Graph & {value?: any};
export type ScriptNode = BaseNode & {script: string};
export type ValueNode = BaseNode & {value?: any};
export type RefNode = BaseNode & {ref: string, value?: any}


export const isNodeValue = (n: Node): n is ValueNode => n && !!(n as ValueNode).value
export const isNodeGraph = (n: Node): n is GraphNode => n && !!(n as GraphNode).nodes
export const isNodeScript = (n: Node): n is ScriptNode => n && !!(n as ScriptNode)?.script;
export const isNodeRef = (n: Node): n is RefNode => n && !!(n as RefNode)?.ref;

export type d3Node = SimulationNodeDatum & {
  node_id: string
} & Node

export type d3Link = SimulationLinkDatum<d3Node> & {
  edge: Edge
}

export type Graph = {
  id: string,
  out?: string,
  Functor?: string,
  name?: string,
  nodes: Record<string, Node>,
  edges: Record<string, Edge>
}

export type Edge = {
  to: string,
  from: string,
  as: string
}

export type Store<T> = {
  add: (id: string, data: T) => void;
  remove: (id: string) => void;
  get: (id: string) => T | undefined;
  removeAll: () => void;
  all: () => Array<T>;
  undo?: false | (() => void);
  redo?: false | (() => void);
  startListening?: false | (() => void);
  addMany?: (datas: Array<[string, any]>) => void;
}

export type RefStore = Store<Node> & {
  add_node: (graphId: string, node: Node) => void;
  remove_node: (graphId: string, node: Node) => void;
  add_edge: (graphId: string, edge: Edge) => void;
  remove_edge: (graphId: string, edge: Edge) => void;
}

export type NodysseusStore = {
  refs: RefStore,
  parents: Store<{parent: string, parentest: string}>,
  graphs: Store<Graph>,
  state: Store<any>,
  fns: Store<{script: string, fn: Function}>,
  assets: Store<Blob>
}

export type LokiT<T> = {
  id: string,
  data: T
}

export type Result = { __kind: "result", value: any }

export type BaseRunnable = {
  __kind: unknown,
  fn: string,
  graph: Graph,
  env: Env,
  lib?: Lib,
}

export type InputRunnable = Omit<BaseRunnable, "__kind" | "env"> & {
  env?: Env
};

export type ApRunnable = {
  __kind: "ap",
  fn: FunctorRunnable | Array<FunctorRunnable>,
  args: ConstRunnable,
  lib?: Lib
}

export type ConstRunnable = BaseRunnable & {
  __kind: "const"
}

export type FunctorRunnable = BaseRunnable & {
  __kind: "functor",
  fnargs: Array<string>
}

export type Runnable =  Result | ApRunnable | FunctorRunnable | ConstRunnable

export const isRunnable = (r: any): r is Runnable => isValue(r as Runnable) || isConstRunnable(r as Runnable) || isApRunnable(r as Runnable) || isFunctorRunnable(r as Runnable);
export const isValue = (r: Runnable): r is Result => (r as Result)?.__kind === "result";
export const isConstRunnable = (r: Runnable): r is ConstRunnable => r?.__kind === "const";
export const isApRunnable = (r: Runnable): r is ApRunnable => r?.__kind === "ap";
export const isFunctorRunnable = (r: Runnable): r is FunctorRunnable => r?.__kind === "functor";
export const isInputRunnable = (r: Runnable | InputRunnable) => !Object.hasOwn(r, "__kind") && Object.hasOwn(r, "fn") && Object.hasOwn(r, "graph")

export type Lib = {
  __kind: "lib",
  data: Record<string, any>
}

export const newLib = (data): Lib => ({__kind: "lib", data})

export type Env = {
  __kind: "env",
  data: Record<string, unknown>,
  _output?: string, 
  env?: Env,
  node_id?: string,
}

export const newEnv = (data, _output?): Env => ({__kind: "env", data, _output})
export const combineEnv = (data, env: Env, node_id?: string, _output?: string): Env => {
  if(isEnv(data)) {
    throw new Error("Can't create an env with env data")
  }
  return ({__kind: "env", data, env, node_id, _output})
}
export const mergeEnv = (data, env: Env): Env => {
  if(isRunnable(data)) {
    throw new Error("Can't merge a runnable")
  }

  return {
  __kind: "env", 
    data: {...env.data, ...data, _output: undefined}, 
    env: env.env, 
    _output: Object.hasOwn(data, "_output") ? isValue(data._output) ? data._output.value : data._output : env._output
  }
}
export const isEnv = (env: any) => env?.__kind === "env"


//export const isApRunnable = (r: Runnable): r is ApRunnable => isGraphRunnable((r as ApRunnable).fn)

export type NodeArg = { exists: boolean, name: string }
