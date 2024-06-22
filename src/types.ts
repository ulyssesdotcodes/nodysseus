export type NodysseusNode = GraphNode | ValueNode | RefNode;

type BaseNode = { id: string; name?: string; category?: string };
export type GraphNode = Graph & { value?: any; category?: string };
export type ValueNode = BaseNode & { value?: string };
export type RefNode = BaseNode & { ref: string; value?: string };

export const isNodeValue = (n: NodysseusNode): n is ValueNode =>
  n && !!(n as ValueNode).value;
export const isNodeGraph = (n: NodysseusNode): n is GraphNode =>
  n && !!(n as GraphNode).nodes;
export const isNodeRef = (n: NodysseusNode): n is RefNode =>
  n && !!(n as RefNode)?.ref;

export const compareNodes = (a: NodysseusNode, b: NodysseusNode) =>
  a.id === b.id &&
  a.name === b.name &&
  ((isNodeRef(a) && isNodeRef(b) && a.ref === b.ref && a.value === b.value) ||
    (isNodeGraph(a) && isNodeGraph(b) && a.nodes === b.nodes) ||
    (isNodeValue(a) && isNodeValue(b) && a.value === b.value));

export type SavedGraph = {
  id: string;
  out?: string;
  name?: string;
  nodes: Record<string, NodysseusNode>;
  edges: Record<string, Edge>;
  description?: string;
};

export type Graph = SavedGraph & {
  edges_in?: Record<string, Record<string, Edge>>;
};

export type ExportedGraph = {
  graphs: Array<Graph>;
  state: Record<string, unknown>;
};

export const isGraph = (graph: any): graph is Graph =>
  graph && Object.hasOwn(graph, "nodes");
export const isEdgesInGraph = (graph: Graph | SavedGraph): graph is Graph =>
  Object.hasOwn(graph, "edges_in");
export const isExportedGraph = (
  g: ExportedGraph | unknown,
): g is ExportedGraph => g && (g as ExportedGraph).graphs.length > 0;

export type EdgesIn = Record<string, Record<string, Edge>>;

export type Edge = EdgeNoAs & { as: string };

export type EdgeNoAs = {
  to: string;
  from: string;
};

export type Store<T> = {
  get: (id: string) => T | undefined | Promise<T | undefined>;
  set: (id: string, data: T) => T | Promise<T>;
  delete: (id: string) => void;
  clear: () => void;
  keys: () => Array<string> | Promise<Array<string>>;
};

export type RefStore = Store<Graph> & {
  addFromUrl: (url: string) => Array<Graph> | Promise<Array<Graph>>;
  add_node: (graphId: string, node: NodysseusNode) => Graph | Promise<Graph>;
  add_nodes_edges: (updates: {
    graphId: string;
    addedNodes?: NodysseusNode[];
    addedEdges?: Edge[];
    removedNodes?: NodysseusNode[];
    removedEdges?: Array<{ [k in Exclude<keyof Edge, "as">]: Edge[k] }>;
  }) => Graph | Promise<Graph>;
  remove_node: (graphId: string, node: NodysseusNode) => Graph | Promise<Graph>;
  add_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
  remove_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
  undo?: false | ((id: string) => undefined | Graph | Promise<Graph>);
  redo?: false | ((id: string) => undefined | Graph | Promise<Graph>);
};

export type StoreType<T extends Store<any>> = Exclude<
  ReturnType<T["get"]>,
  undefined | Promise<any>
>;
export type NodysseusStoreTypes = {
  [k in keyof NodysseusStore]: StoreType<NodysseusStore[k]>;
};

export type NodysseusStore = {
  refs: RefStore;
  parents: Store<{ parent: string; parentest: string; nodeRef?: string }>;
  state: Store<any>;
  persist: Store<any>;
  fns: Store<{ script: string; fn: Function }>;
  assets: Store<Blob>;
};

export type LokiT<T> = {
  id: string;
  data: T;
};

export type Lib = {
  __kind: "lib";
  data: Record<string, any>;
};

export const isLib = (lib: any): lib is Lib => lib?.__kind === "lib";

export type Env = {
  __kind: "env";
  data: Args;
  _output?: string;
  env?: Env;
  node_id?: string;
};

export const isEnv = (env: any): env is Env => env?.__kind === "env";

//export const isApRunnable = (r: Runnable): r is ApRunnable => isGraphRunnable((r as ApRunnable).fn)

export type ApFunction = {
  __kind: "apFunction";
  fn: Function;
  args: Array<string>;
  promiseArgs?: boolean;
  rawArgs?: boolean;
  outputs?: {
    lib?: boolean;
    display?: boolean;
  };
};

// TODO: type this better
export type Extern = {
  args: Array<string | FullyTypedArg> | Record<string, string | FullyTypedArg>;
  fn: Function;
};
export type NodeArg = {
  exists: boolean;
  name: string;
} & Partial<FullyTypedArg>;

export type Args = Map<string, unknown>;
export type ResolvedArgs = Map<string, unknown>;
export const isArgs = (args: any): args is Args =>
  typeof args?.get === "function";

export type RunOptions = {
  profile?: boolean;
  resolvePromises?: boolean;
  timings?: Record<string, number>;
};

type _BaseFullyTypedArg = {
  type:
    | string
    | Record<
        string,
        | string
        | FullyTypedArg
        | ((graph: Graph, nodeId: string) => FullyTypedArg)
      >;
  default?: boolean;
  additionalArg?: boolean;
  local?: boolean;
};

type _RunnableTypedArg = _BaseFullyTypedArg & {
  type: "@flow.runnable";
  runnableParameters: Array<string>;
};

export type FullyTypedArg = _BaseFullyTypedArg | _RunnableTypedArg;

export const isRunnableTypedArg = (a: FullyTypedArg): a is _RunnableTypedArg =>
  a.type === "@flow.runnable";

export type TypedArg = string | FullyTypedArg;
export const isTypedArg = (a: any): a is TypedArg =>
  a &&
  (typeof a === "string" ||
    typeof a.type === "string" ||
    typeof a.type === "object");

export type NodeMetadata = {
  parameters?: Array<string>;
  values?: Array<string>;
  dataLabel?: string;
  codeEditor?: {
    language?: "javascript" | "json" | "markdown" | false;
    onChange?: Function;
    editorText?: string;
  };
};

export type MemoryState<T = any> = {
  __kind: "state";
  id: string;
  set: ApFunction;
  state: T;
};
export type MemoryReference<T = any> = {
  __kind: "reference";
  id: string;
  set: ApFunction;
  value: T;
};
// export type MemoryCache = {__kind: "cache", id: string, recache: (value: any) => boolean, value: () => any};
export class MemoryCache<T = any> {
  public __kind = "cache";
  private cachedValue: T;
  constructor(
    private recacheFn: (value: T) => boolean,
    private valueFn: () => T,
  ) {
    this.cachedValue = valueFn();
  }
  recache() {
    return this.recacheFn(this.cachedValue);
  }
  value() {
    if (this.recacheFn(this.cachedValue)) {
      this.cachedValue = this.valueFn();
    }
    return this.cachedValue;
  }
}

export type Memory<T> = MemoryState<T> | MemoryReference<T> | MemoryCache<T>;
export const isMemory = (v: any) =>
  v &&
  typeof v === "object" &&
  (v.__kind === "state" || v.__kind === "reference" || v.__kind === "cache");

export type GenericHTMLElement = {
  dom_type: string;
  children: Array<GenericHTMLElement>;
  props: {
    onref: (el: any) => void;
  } & Record<string, unknown>;
  value: any;
};
export type GenericHTMLText = { dom_type: "text_value"; text: string };
export type GenericHTMLNode = GenericHTMLElement | GenericHTMLText;
