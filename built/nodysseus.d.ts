import { ispromise } from "./util.js";
import { Graph, NodysseusNode, NodysseusStore, Store, Result, Runnable, Edge, InputRunnable, Lib, Env, Args, ResolvedArgs, RunOptions } from "./types.js";
export declare const mapStore: <T>() => Store<T>;
declare let resfetch: (urlstr: any, params?: any) => Promise<string | Response>;
export declare const nodysseus_get: (obj: Record<string, any> | Args | Env, propsArg: string, lib: Lib, defaultValue?: any, props?: Array<string>, options?: RunOptions) => any;
declare function compare(value1: any, value2: any): boolean;
declare const hashcode: (str: any, seed?: number) => number;
declare class NodysseusError extends Error {
    cause: {
        node_id: string;
    };
    constructor(node_id: any, ...params: any[]);
}
declare const resolve_args: (data: Args, lib: Lib, options: RunOptions) => Result | Promise<Result>;
declare const initStore: (store?: NodysseusStore | undefined) => void;
export declare const run: (node: Runnable | InputRunnable, args?: ResolvedArgs | Record<string, unknown>, options?: {
    lib?: Lib;
    store?: NodysseusStore;
} & RunOptions) => any;
declare const runtimefn: () => {
    readonly run: (node: Runnable | InputRunnable, args?: ResolvedArgs | Record<string, unknown>, options?: {
        lib?: Lib;
        store?: NodysseusStore;
    } & RunOptions) => any;
    readonly get_ref: (id: any, otherwise?: any) => any;
    readonly add_ref: (graph: NodysseusNode) => any;
    readonly add_refs: (gs: any) => any;
    readonly addRefsFromUrl: (url: string) => Graph[] | Promise<Graph[]>;
    readonly remove_ref: (id: any) => void;
    readonly get_node: (graph: Graph, id: string) => NodysseusNode;
    readonly get_edge: (graph: any, from: any) => Edge;
    readonly get_edges_in: (graph: Graph, id: any) => Edge[];
    readonly get_edge_out: (graph: any, from: any) => Edge;
    readonly get_parent: (graph: any) => Graph | Promise<Graph>;
    readonly get_parentest: (graph: any) => Graph | Promise<Graph>;
    readonly get_fn: (id: any, name: any, orderedargs: any, script: any) => Function;
    readonly graphExport: (graphid: any) => Array<Graph> | Promise<Array<Graph>>;
    readonly change_graph: (graph: Graph | string, lib: Lib | Record<string, any>, changedNodes?: Array<string>, broadcast?: boolean, source?: any) => Graph | Promise<Graph>;
    readonly update_graph: (graphid: any, lib: Lib) => any;
    readonly update_args: (graph: any, args: any, lib: Lib) => void;
    readonly clearState: () => void;
    readonly delete_cache: () => void;
    readonly clearListeners: () => void;
    readonly get_graph: (graph: string | Graph) => Graph | Promise<Graph> | undefined;
    readonly get_args: (graph: any) => any;
    readonly get_path: (graph: any, path: any) => any;
    readonly add_asset: (id: any, b: any) => Blob | Promise<Blob>;
    readonly get_asset: (id: any, b: any) => Blob | Promise<Blob>;
    readonly list_assets: () => string[] | Promise<string[]>;
    readonly remove_asset: (id: any) => void;
    readonly refs: () => string[] | Promise<string[]>;
    readonly ref_graphs: () => Promise<string[]>;
    readonly updateGraph: ({ graph, addedNodes, addedEdges, removedNodes, removedEdges, lib, dryRun }: {
        graph: string | Graph;
        addedEdges?: Array<Edge>;
        removedEdges?: {
            to: string;
            from: string;
        }[];
        addedNodes?: Array<NodysseusNode>;
        removedNodes?: Array<NodysseusNode>;
        lib: Lib;
        dryRun?: boolean;
    }) => Promise<Graph>;
    readonly add_node: (graph: Graph, node: NodysseusNode, lib: Lib) => void;
    readonly add_nodes_edges: (graph: any, nodes: NodysseusNode[], edges: Edge[], remove_edges: Edge[], remove_nodes: NodysseusNode[], lib: Lib) => void;
    readonly delete_node: (graph: Graph, id: any, lib: Lib, changeEdges?: boolean) => void;
    readonly addListener: (event: any, listener_id: any, input_fn: any, remove?: boolean, graph_id?: boolean, prevent_initial_trigger?: boolean, lib?: Lib, options?: RunOptions) => any;
    readonly addListener_extern: {
        readonly args: readonly ["event", "listener_id", "fn"];
        readonly addListener: (event: any, listener_id: any, input_fn: any, remove?: boolean, graph_id?: boolean, prevent_initial_trigger?: boolean, lib?: Lib, options?: RunOptions) => any;
    };
    readonly removeListener: (event: any, listener_id: any) => void;
    readonly pauseGraphListeners: (graph_id: string, paused: boolean) => boolean | Set<string>;
    readonly isGraphidListened: (graphId: string) => boolean;
    readonly isListened: (event: string, listenerId: string) => boolean;
    readonly togglePause: (newPause: boolean) => boolean;
    readonly publish: (event: any, data: any, lib: Lib, options?: RunOptions, broadcast?: boolean) => any;
    readonly set_parent: (graph: any, parent: any) => void;
    readonly undo: (id: string) => void;
    readonly redo: (id: string) => void;
    readonly store: NodysseusStore;
    readonly ancestor_graph: (node_id: string, from_graph: import("./types.js").SavedGraph | Graph, nolib?: Record<string, any>) => Graph;
};
type Runtime = ReturnType<typeof runtimefn>;
declare const nolib: Record<string, any> & {
    no: {
        runtime: Runtime;
    } & Record<string, any>;
};
declare const nolibLib: Lib;
export { nolib, nolibLib, initStore, compare, hashcode, ispromise, NodysseusError, resfetch, resolve_args };
