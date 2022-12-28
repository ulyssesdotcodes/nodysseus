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

export type Result = {__value: any, __isnodysseus: true}

// not used
export type ApRunnable = {
  fn: Runnable,
  args: Runnable,
  lib?: any,
  __isnodysseus?: true
}

export type GraphRunnable = {
  fn: string,
  graph: Graph,
  args: any,
  lib?: any,
  __isnodysseus?: true
}

export type Runnable =  Result | GraphRunnable

export const isValue = (r: Runnable): r is Result => !!(r as Result)?.__value;
export const isGraphRunnable = (r: Runnable): r is GraphRunnable => !!(r as GraphRunnable).graph
//export const isApRunnable = (r: Runnable): r is ApRunnable => isGraphRunnable((r as ApRunnable).fn)

export type NodeArg = { exists: boolean, name: string }
