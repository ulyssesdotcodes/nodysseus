import { IDBPDatabase } from "idb";
import { Graph, NodysseusStoreTypes, RefStore } from "src/types.js";
export declare const automergeRefStore: ({ nodysseusidb, persist, graphChangeCallback }: {
    persist: boolean;
    nodysseusidb: IDBPDatabase<NodysseusStoreTypes>;
    graphChangeCallback?: (graph: Graph, changedNodes: Array<string>) => void;
}) => Promise<RefStore>;
