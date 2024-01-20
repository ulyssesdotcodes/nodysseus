import { initStore } from "./nodysseus.js";
import { initPort, processMessage, SWState } from "./editor/store.js";
import { urlRefStore } from "./store.js";

// TODO: get/set have ids to give responses. whenever a graph is updated, send update to all clients

self.onerror = (e) => console.error("sharedworker error", e);

const store: SWState = { value: undefined, initQueue: [] };
const ports: Array<MessagePort> = [];

self.onconnect = (e) => initPort(store, ports, e.ports[0]);

const examplesUrl = (typeof window !== "undefined" && window.location.host === "nodysseus.io") || (typeof self !== "undefined" && self.location.host === "nodysseus.io") ? "https://nodysseus.azurewebsites.net/api/graphs" : "http://localhost:7071/api/graphs";

Promise.all([
  import("./editor/store.js"),
  import("./editor/automergeStore.js"),
]).then(([{ webClientStore }, { automergeRefStore }]) => {
  console.log("examplesurl", examplesUrl)
  webClientStore((nodysseusidb) =>
    automergeRefStore({
      nodysseusidb,
      persist: true,
      graphChangeCallback: (graph) =>
        ports.forEach((p) =>
          p.postMessage({ kind: "update", graphs: [graph] }),
        ),
      fallbackRefStore: urlRefStore(examplesUrl)
    }),
  ).then((resStore) => {
    store.value = resStore.refs;
    initStore(resStore);
    store.initQueue.forEach((e) =>
      processMessage(store.value, ports, e[0], e[1]),
    );
  });
});
