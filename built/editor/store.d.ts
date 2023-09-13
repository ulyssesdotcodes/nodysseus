import { IDBPDatabase } from "idb";
import { Edge, EdgeNoAs, Graph, NodysseusNode, NodysseusStore, NodysseusStoreTypes, RefStore } from "../types.js";
import { SharedWorkerMessageTo } from "./types.js";
export declare const addNode: (graph: Graph, node: NodysseusNode) => Graph;
export declare const removeNode: (node: any) => (doc: any) => void;
export declare const addEdge: (g: Graph, edge: Edge) => Graph;
export declare const removeEdge: (edge: any) => (g: any) => void;
export declare const addNodesEdges: (graph: Graph, addedNodes?: Array<NodysseusNode>, addedEdges?: Array<Edge>, removedNodes?: Array<NodysseusNode>, removedEdges?: Array<EdgeNoAs>) => Graph;
export type SWState = {
    value: RefStore | undefined;
    initQueue: Array<[MessagePort, SharedWorkerMessageTo]>;
};
export declare const initPort: (store: SWState, ports: MessagePort[], port: MessagePort) => void;
export declare const processMessage: (store: RefStore, ports: MessagePort[], port: MessagePort, m: SharedWorkerMessageTo) => import("../util.js").WrappedPromise<void> | import("../util.js").WrappedPromise<boolean>;
export declare const sharedWorkerRefStore: (port: MessagePort) => Promise<RefStore>;
export declare const openNodysseusDB: () => Promise<IDBPDatabase<NodysseusStoreTypes>>;
export declare const webClientStore: (refStore: (idb: IDBPDatabase<NodysseusStoreTypes>) => Promise<RefStore>) => Promise<NodysseusStore>;
export declare const objectRefStore: (graphs: Record<string, Graph>) => RefStore;
