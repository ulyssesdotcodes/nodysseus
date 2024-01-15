import {
  ForceLink,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force";
import { NodysseusError } from "../nodysseus.js";
import {
  Graph,
  Edge,
  NodysseusNode,
  RefStore,
  EdgeNoAs,
  NodeMetadata,
  NodeArg,
} from "../types.js";
import { Compartment, StateEffectType, StateField } from "@codemirror/state";
import { VarNode } from "src/dependency-tree/dependency-tree.js";
import { EditorView } from "codemirror";

export type Vector2 = { x: number; y: number };

export type Property = "ref" | "value" | "name" | "edge";

export type HyperappState = {
  editingGraphId: string;
  editingGraph: Graph;
  displayGraphId: string | false;
  displayGraph: Graph | false;
  hash: string;
  stopped: boolean;
  noautozoom: boolean;
  url_params: URLSearchParams;
  html_id: string;
  dimensions: Vector2;
  readonly: boolean;
  norun: boolean;
  hide_types: boolean;
  offset: Vector2;
  focused: boolean;
  editing: boolean;
  search: boolean;
  searchResults: Array<string>;
  searchFocused: boolean;
  show_all: boolean;
  show_result: boolean;
  node_el_width: number;
  args_display: boolean;
  selected: Array<string>;
  selected_edges_in: Array<Edge>;
  error: false | NodysseusError;
  levels: false | Levels;
  randid: string;
  inputs: Record<string, string>;
  copied?: {
    graph: Graph;
  };
  simulation?: NodysseusSimulation;
  nodeOffset: Vector2;
  clear_simulation_cache?: boolean;
  info_display_dispatch?: Function;
  result_display_dispatch?: Function;
  result_background_display_dispatch?: Function;
  custom_editor_display_dispatch?: Function;
  code_editor?: EditorView;
  code_editor_nodeid?: StateEffectType<string>;
  code_editor_nodeid_field?: StateField<string>;
  codeEditorExtensions?: Compartment;
  custom_editor_result: {};
  showHelp: boolean;
  refGraphs: Array<string>;
  selectedMetadata?: NodeMetadata;
  cachedMetadata: Record<string, NodeMetadata>;
  initialLayout: boolean;
  selectedNodeArgs?: Array<NodeArg>;
  selectedNodeEdgeLabels?: Array<string>;
  selectedVarNode?: VarNode<{ graph: string; id: string }>;
};

export type Levels = {
  level_by_node: Map<string, number>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  siblings: Map<string, string[]>;
  distance_from_selected: Map<string, number>;
  min: number;
  max: number;
  nodes_by_level: Record<number, string>;
};

export type d3NodeNode = SimulationNodeDatum & {
  node_id: string;
  nested_edge_count: number;
  nested_node_count: number;
  hash?: number;
  sibling_index_normalized?: number;
  calculatedX: number;
  calculatedY: number;
} & NodysseusNode;

export const isd3NodeNode = (n: d3Node): n is d3NodeNode =>
  !!(n as d3NodeNode).node_id;

export type d3LinkNode = SimulationNodeDatum & {
  id: string;
  edge: Edge;
  desiredX: number;
  desiredY: number;
};

export type d3Node = d3NodeNode | d3LinkNode;

export type d3Link = SimulationLinkDatum<d3NodeNode> & {
  edge: Edge;
};

export type NodysseusSimulation = {
  selectedOffset: Vector2;
  simulation: Simulation<d3Node, d3Link>;
};
export type NodysseusForceLink = ForceLink<d3Node, d3Link>;

// SharedWorker messages

type _SharedWorkerMessages = {
  addPort: {
    to: { port: MessagePort };
  };
  get: {
    to: { graphId: string };
    from: { graph: Graph };
  };
  set: {
    to: { graph: Graph };
  };
  delete: {
    to: { graphId: string };
    from: {};
  };
  clear: {
    to: {};
  };
  keys: {
    to: {};
    from: { keys: Array<string> };
  };
  undo: {
    to: { graphId: string };
    from: { graph: Graph };
  };
  redo: {
    to: { graphId: string };
    from: { graph: Graph };
  };
  add_node: {
    to: { graphId: string; node: NodysseusNode };
  };
  remove_node: {
    to: { graphId: string; node: string };
  };
  add_edge: {
    to: { graphId: string; edge: Edge };
  };
  remove_edge: {
    to: { graphId: string; edgeTo: string };
  };
  add_nodes_edges: {
    to: {
      graphId: string;
      addedNodes: Array<NodysseusNode>;
      addedEdges: Array<Edge>;
      removedNodes: Array<NodysseusNode>;
      removedEdges: Array<EdgeNoAs>;
    };
  };
  connect: {
    from: {};
  };
  update: {
    from: { graphs: Array<Graph> };
  };
  addFromUrl: {
    to: { url: string };
    from: { graphs: Array<Graph> };
  };
};

type _SharedWorkerMessageKind = keyof _SharedWorkerMessages;
export type SharedWorkerMessageKind = _SharedWorkerMessageKind;

export type TRespondableSharedWorkerMessage<T> =
  T extends _SharedWorkerMessageKind
    ? _SharedWorkerMessages[T] extends { to: any; from: any }
      ? TSharedWorkerMessageTo<T> | TSharedWorkerMessageFrom<T>
      : never
    : never;

export type RespondableSharedWorkerMessage =
  TRespondableSharedWorkerMessage<SharedWorkerMessageKind>;
export type RespondableSharedWorkerMessageData = Omit<
  RespondableSharedWorkerMessage,
  "messageId"
>;

type _SharedWorkerMessageId<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessages[T] extends { to: any; from: any }
    ? { messageId: string }
    : {}
  : never;

type _SharedWorkerMessage<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessages[T]
  : never;

export type TSharedWorkerMessage<T> = _SharedWorkerMessage<T> &
  _SharedWorkerMessageId<T>;
export type SharedWorkerMessage =
  TSharedWorkerMessage<_SharedWorkerMessageKind>;

type _TSharedWorkerMessageTo<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessage<T> extends { to: any }
    ? _SharedWorkerMessage<T>["to"] & { kind: T }
    : never
  : never;
export type TSharedWorkerMessageToData<T> = _TSharedWorkerMessageTo<T>;

export type TSharedWorkerMessageTo<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessages[T] extends { to: any; from: any }
    ? _TSharedWorkerMessageTo<T> & { messageId: string }
    : _TSharedWorkerMessageTo<T>
  : never;

type _SharedWorkerMessageTo = _TSharedWorkerMessageTo<_SharedWorkerMessageKind>;
export type SharedWorkerMessageTo =
  TSharedWorkerMessageTo<_SharedWorkerMessageKind>;

type _TSharedWorkerMessageFrom<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessage<T> extends { from: any }
    ? _SharedWorkerMessage<T>["from"] & { kind: T }
    : never
  : never;
export type TSharedWorkerMessageFrom<T> = T extends _SharedWorkerMessageKind
  ? _SharedWorkerMessages[T] extends { to: any; from: any }
    ? _TSharedWorkerMessageFrom<T> & { messageId: string }
    : _TSharedWorkerMessageFrom<T>
  : never;

type _SharedWorkerMessageFrom =
  _TSharedWorkerMessageFrom<_SharedWorkerMessageKind>;
export type SharedWorkerMessageFrom =
  TSharedWorkerMessageFrom<_SharedWorkerMessageKind>;

export const expectSharedWorkerMessageResponse = <
  T extends _SharedWorkerMessageKind,
>(
  m: SharedWorkerMessageTo | SharedWorkerMessageFrom,
): m is TRespondableSharedWorkerMessage<T> =>
  !!(m as TRespondableSharedWorkerMessage<T>).messageId;

// const test = <T extends SharedWorkerMessageKind>(m: Omit<TSharedWorkerMessageTo<T>, "messageId">) => {};

// export type NodysseusStoreMessageData =
//   { kind: "get", graphid: string }
//   | { kind: "keys" }

// export type NodysseusStoreMessage = {id: string} & NodysseusStoreMessageData

// export type NodysseusStoreResponseMessage =
//   { kind: "get", id: string, graph: Graph }
//   | { kind: "keys", id: string, keys: Array<string> }
//   | { kind: "connect" }
