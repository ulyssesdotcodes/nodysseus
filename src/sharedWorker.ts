import {initStore} from "./nodysseus"
// import {automergeRefStore, openNodysseusDB, webClientStore} from "./editor/store"
// import { Graph, NodysseusStore } from "./types";
// import { wrap } from "idb";
import { SharedWorkerMessage, SharedWorkerMessageFrom, SharedWorkerMessageKind, SharedWorkerMessageTo } from "./editor/types";
import { NodysseusStore, RefStore } from "./types";
import { wrapPromise } from "./util";
import { initPort, processMessage, SWState } from "./editor/store";

// TODO: get/set have ids to give responses. whenever a graph is updated, send update to all clients

self.onerror = e => console.error("sharedworker error", e)

let store: SWState = {value: undefined, initQueue: []};
let ports: Array<MessagePort> = []

self.onconnect = (e) => initPort(store, ports, e.ports[0])

Promise.all([import("./editor/store"), import("./editor/automergeStore")]).then(([{webClientStore}, {automergeRefStore}]) => {
  webClientStore(nodysseusidb => automergeRefStore({nodysseusidb, persist: true}))
    .then(resStore => {
      store.value = resStore.refs;
      initStore(resStore);
      store.initQueue.forEach(e => processMessage(store.value, ports, e[0], e[1]));
    })
})
