import loki from "lokijs";
import { LokiT, NodysseusStore, Store } from "./types.js";
export declare const lokidbToStore: <T>(collection: loki.Collection<LokiT<T>>) => Store<T>;
export declare const lokiStore: () => NodysseusStore;
