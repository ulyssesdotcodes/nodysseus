
export type Node = ({
  id: string;
  name?: string;
} & (
  {value: any}
  | {value?: any, ref: string}
  | {script: string} // deprecated
)) | (Graph & {value?: any});

export const isNodeGraph = (n: Node): n is Graph => !!(n as Graph).nodes

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
}

export type NodysseusStore = {
  refs: Store<Node>,
  parents: Store<{parent: string, parentest: string}>,
  nodes: Store<Node>,
  state: Store<any>,
  fns: Store<{script: string, fn: Function}>
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
