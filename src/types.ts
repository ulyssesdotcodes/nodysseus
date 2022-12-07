import { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export type Node = GraphNode | ScriptNode | ValueNode | RefNode;

type BaseNode = {id: string, name?: string};
export type GraphNode = Graph & {value?: any};
export type ScriptNode = BaseNode & {script: string};
export type ValueNode = BaseNode & {value?: any};
export type RefNode = BaseNode & {ref: string, value?: any}


export const isNodeGraph = (n: Node): n is Graph => !!(n as Graph).nodes
export const isNodeScript = (n: Node): n is ScriptNode => !!(n as ScriptNode)?.script;
export const isNodeRef = (n: Node): n is RefNode => !!(n as RefNode)?.ref;

export type d3Node = SimulationNodeDatum & {
  node_id: string
} & Node

export type d3Link = SimulationLinkDatum<d3Node> & {
  edge: Edge
}

export type Graph = {
  id: string,
  out?: string,
  nodes: Array<Node>,
  edges: Array<Edge>
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

export type NodysseusStore = {
  refs: Store<Node>,
  parents: Store<{parent: string, parentest: string}>,
  nodes: Store<Node>,
  state: Store<any>,
  fns: Store<{script: string, fn: Function}>,
  assets: Store<Blob>
}

export type LokiT<T> = {
  id: string,
  data: T
}

export type Result = {__value: any, __isnodysseus: true}

export type Runnable<T extends {}> = ({
  fn: string,
  graph: Graph,
  args: T,
  __isnodysseus?: true
} | Result)

export const isValue = <T>(r: Runnable<T>): r is Result => !!(r as Result)?.__value;
