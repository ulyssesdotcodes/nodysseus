// import {initStore} from "./nodysseus"
// import {automergeRefStore, openNodysseusDB, webClientStore} from "./editor/store"
// import { Graph, NodysseusStore } from "./types";
import { SharedWorkerMessageTo } from "./editor/types";
import { wrapPromise } from "./util";

// TODO: get/set have ids to give responses. whenever a graph is updated, send update to all clients


let store;

let initQueue = [];

const processMessage = (port: MessagePort, m: SharedWorkerMessageTo) => {
  console.log("processing", m)
  if(m.kind === "get") {
    wrapPromise(store.refs.get(m.graphId))
      .then(graph => port.postMessage({kind: "get", messageId: m.messageId, graph}))
  } else if (m.kind === "keys") {
    wrapPromise(store.refs.keys())
      .then(keys => port.postMessage({kind: "keys", messageId: m.messageId, keys}))
  }
}

self.onerror = e => console.error("sharedworker error", e)

self.onconnect = (e) => {
  console.log("connect!", e)
  const port = e.ports[0];

  port.addEventListener("message", (e) => {
    console.log("shared worker message", e.data)

    if(store) {
      processMessage(port, e.data)
    } else {
      initQueue.push([port, e.data]);
    }
  })

  port.start();

  port.postMessage({kind: "connect"})
};

import("./editor/store").then(({automergeRefStore, webClientStore}) => {
  webClientStore(nodysseusidb => automergeRefStore({nodysseusidb, persist: true}))
    .then(resStore => {
      console.log("got store ts", resStore)
      store = resStore;
      // initStore(store);
      initQueue.forEach(e => processMessage(e[0], e[1]));
    })
})
