export type NodysseusNode = GraphNode | ScriptNode | ValueNode | RefNode;
type BaseNode = {
    id: string;
    name?: string;
    category?: string;
};
export type GraphNode = Graph & {
    value?: any;
    category?: string;
};
export type ScriptNode = BaseNode & {
    script: string;
};
export type ValueNode = BaseNode & {
    value?: string;
};
export type RefNode = BaseNode & {
    ref: string;
    value?: string;
};
export declare const isNodeValue: (n: NodysseusNode) => n is ValueNode;
export declare const isNodeGraph: (n: NodysseusNode) => n is GraphNode;
export declare const isNodeScript: (n: NodysseusNode) => n is ScriptNode;
export declare const isNodeRef: (n: NodysseusNode) => n is RefNode;
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
export declare const isGraph: (graph: any) => graph is Graph;
export declare const isEdgesInGraph: (graph: Graph | SavedGraph) => graph is Graph;
export type EdgesIn = Record<string, Record<string, Edge>>;
export type Edge = EdgeNoAs & {
    as: string;
};
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
        removedEdges?: Array<{
            [k in Exclude<keyof Edge, "as">]: Edge[k];
        }>;
    }) => Graph | Promise<Graph>;
    remove_node: (graphId: string, node: NodysseusNode) => Graph | Promise<Graph>;
    add_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
    remove_edge: (graphId: string, edge: Edge) => Graph | Promise<Graph>;
    undo?: false | ((id: string) => void);
    redo?: false | ((id: string) => void);
};
export type StoreType<T extends Store<any>> = Exclude<ReturnType<T["get"]>, undefined | Promise<any>>;
export type NodysseusStoreTypes = {
    [k in keyof NodysseusStore]: StoreType<NodysseusStore[k]>;
};
export type NodysseusStore = {
    refs: RefStore;
    parents: Store<{
        parent: string;
        parentest: string;
    }>;
    state: Store<any>;
    persist: Store<any>;
    fns: Store<{
        script: string;
        fn: Function;
    }>;
    assets: Store<Blob>;
};
export type LokiT<T> = {
    id: string;
    data: T;
};
type NonErrorResult = {
    __kind: "result";
    value: any;
};
export type Result = NonErrorResult | Error;
export type BaseRunnable = {
    __kind: unknown;
    fn: string;
    graph: string | Graph;
    env: Env;
    lib: Lib;
};
export type InputRunnable = Omit<BaseRunnable, "__kind" | "env" | "lib"> & {
    env?: Env;
    lib?: Lib;
};
export declare const AP = "ap";
export type ApFunction = {
    __kind: "apFunction";
    fn: Function;
    args: Array<string>;
    promiseArgs?: boolean;
    rawArgs?: boolean;
    outputs: {
        lib?: boolean;
        display?: boolean;
    };
};
export declare const isApFunction: (a: any) => a is ApFunction;
export type ApFunctorLike = FunctorRunnable | ApRunnable | ApFunction | Function;
export declare const isApFunctorLike: (a: any) => boolean;
export type ApRunnable = {
    __kind: "ap";
    fn: ApFunctorLike | Array<ApFunctorLike>;
    args: ConstRunnable | Env;
    lib: Lib;
};
export declare const CONST = "const";
export type ConstRunnable = BaseRunnable & {
    __kind: "const";
};
export declare const FUNCTOR = "functor";
export type FunctorRunnable = BaseRunnable & {
    __kind: "functor";
    parameters: Array<string>;
};
export type Runnable = Result | ApRunnable | FunctorRunnable | ConstRunnable;
export declare const isRunnable: (r: any) => r is Runnable;
export declare const isError: (r: any) => r is Error;
export declare const isValue: (r: Runnable) => r is NonErrorResult;
export declare const isConstRunnable: (r: Runnable) => r is ConstRunnable;
export declare const isApRunnable: (r: Runnable) => r is ApRunnable;
export declare const isFunctorRunnable: (r: Runnable) => r is FunctorRunnable;
export declare const isInputRunnable: (r: Runnable | InputRunnable) => r is InputRunnable;
export declare const getRunnableGraph: (r: Runnable | InputRunnable, lib: Lib) => Graph;
export declare const getRunnableGraphId: (r: Runnable | InputRunnable, lib: Lib) => string;
export type Lib = {
    __kind: "lib";
    data: Record<string, any>;
};
export declare const isLib: (lib: any) => lib is Lib;
export type Env = {
    __kind: "env";
    data: Args;
    _output?: string;
    env?: Env;
    node_id?: string;
};
export declare const isEnv: (env: any) => env is Env;
export type Extern = {
    args: Array<string | FullyTypedArg> | Record<string, string | FullyTypedArg>;
    fn: Function;
};
export type NodeArg = {
    exists: boolean;
    name: string;
} & Partial<FullyTypedArg>;
export type Args = Map<string, ConstRunnable | Result>;
export type ResolvedArgs = Map<string, unknown>;
export declare const isArgs: (args: any) => args is Args;
export type RunOptions = {
    profile?: boolean;
    resolvePromises?: boolean;
    timings?: Record<string, number>;
};
export type FullyTypedArg = {
    type: string | Record<string, string | FullyTypedArg | ((graph: Graph, nodeId: string) => FullyTypedArg)>;
    default?: boolean;
    additionalArg?: boolean;
    local?: boolean;
};
export type TypedArg = string | FullyTypedArg;
export declare const isTypedArg: (a: any) => a is TypedArg;
export type NodeMetadata = {
    parameters?: Array<string>;
    values?: Array<string>;
    dataLabel?: string;
};
export {};
