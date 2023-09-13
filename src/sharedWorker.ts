import {initStore} from "./nodysseus.js"
import { initPort, processMessage, SWState } from "./editor/store.js";

// TODO: get/set have ids to give responses. whenever a graph is updated, send update to all clients

self.onerror = e => console.error("sharedworker error", e)

let store: SWState = {value: undefined, initQueue: []};
let ports: Array<MessagePort> = []

self.onconnect = (e) => initPort(store, ports, e.ports[0])

Promise.all([import("./editor/store.js"), import("./editor/automergeStore.js")]).then(([{webClientStore}, {automergeRefStore}]) => {
  webClientStore(nodysseusidb => automergeRefStore({
    nodysseusidb, 
    persist: true, 
    graphChangeCallback: (graph) => ports.forEach(p => p.postMessage({kind: "update", graphs: [graph]}))
  }))
    .then(resStore => {
      store.value = resStore.refs;
      initStore(resStore);
      store.initQueue.forEach(e => processMessage(store.value, ports, e[0], e[1]));
    })
})
