import { Edge, Graph, NodysseusNode, Runnable, Lib, Env, Args, SavedGraph } from "./types.js";
export declare const WRAPPED_KIND = "wrapped";
type WrappedKind = "wrapped";
export declare const ispromise: <T>(a: any) => a is Promise<T>;
export declare const isWrappedPromise: <T>(a: any) => a is WrappedPromise<T>;
export declare const isgraph: (g: any) => boolean;
export type WrappedPromise<T> = {
    __kind: WrappedKind;
    then: <S>(fn: (t: FlattenPromise<T>) => S) => WrappedPromise<S>;
    value: T;
};
type FlattenWrappedPromise<T> = T extends WrappedPromise<infer Item> ? Item : T;
export declare const wrapPromise: <T>(t: T, c?: <E extends Error, S>(fn: (e?: E) => S) => S) => WrappedPromise<FlattenWrappedPromise<T>>;
export declare const wrapPromiseAll: <T>(wrappedPromises: (T | WrappedPromise<T>)[]) => WrappedPromise<Array<any> | Promise<Array<any>>>;
export type IfPromise<T, S> = T extends Promise<infer _> ? S : Promise<S>;
export type FlattenPromise<T> = T extends Promise<infer Item> ? Item : T;
export declare const base_node: (node: any) => {
    id: any;
    value: any;
    name: any;
    nodes: any;
    edges: any;
    edges_in: any;
    out: any;
    description: any;
} | {
    id: any;
    value: any;
    name: any;
    ref: any;
};
export declare const base_graph: (graph: any) => {
    id: any;
    value: any;
    name: any;
    nodes: any;
    edges: any;
    edges_in: any;
    out: any;
    description: any;
};
export declare const create_randid: (graph: Graph) => any;
type FlattenedGraph = {
    flat_nodes: Record<string, NodysseusNode>;
    flat_edges: Record<string, Edge>;
};
export declare const flattenNode: (graph: NodysseusNode, levels?: number) => FlattenedGraph | NodysseusNode;
export declare const expand_node: (data: {
    nolib: Record<string, any>;
    node_id: string;
    editingGraph: Graph;
}) => {
    editingGraph: Graph;
    selected: Array<string>;
};
export declare const contract_node: (data: {
    editingGraph: Graph;
    node_id: string;
    nolib: any;
}, keep_expanded?: boolean) => {
    editingGraph: Graph;
    selected: string[];
} | {
    selected: string[];
    editingGraph?: undefined;
};
export declare const ancestor_graph: (node_id: string, from_graph: Graph | SavedGraph, nolib?: Record<string, any>) => Graph;
export declare const descendantGraph: (nodeId: string, graph: Graph, nolib?: Record<string, any>) => Graph;
export declare const newEnv: (data: Args, _output?: any, env?: Env) => Env;
export declare const combineEnv: (data: Args, env: Env, node_id?: string, _output?: string) => Env;
export declare const mergeEnv: (data: Args, env: Env) => Env;
export declare const newLib: (data: any) => Lib;
export declare const mergeLib: (a: Record<string, any> | Lib, b: Lib) => Lib;
export declare const runnableId: (runnable: Runnable) => string | false;
export declare function compareObjects(value1: any, value2: any, isUpdate?: boolean): boolean;
export declare function set_mutable(obj: any, propsArg: any, value: any): boolean;
export declare const bfs: (graph: Graph, fn: any) => (id: any, level: any) => void;
export {};
