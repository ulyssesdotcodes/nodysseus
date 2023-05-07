import {initStore} from "./nodysseus"
// import {automergeRefStore, openNodysseusDB, webClientStore} from "./editor/store"
// import { Graph, NodysseusStore } from "./types";
// import { wrap } from "idb";
import { SharedWorkerMessage, SharedWorkerMessageFrom, SharedWorkerMessageKind, SharedWorkerMessageTo } from "./editor/types";
import { NodysseusStore } from "./types";
import { wrapPromise } from "./util";

// TODO: get/set have ids to give responses. whenever a graph is updated, send update to all clients


let store: NodysseusStore;

let initQueue = [];
let ports: Array<MessagePort> = []

const typedPostMessage = (port: MessagePort, m: SharedWorkerMessageFrom) => 
  port.postMessage(m)

type ModifyingMessage<T> = T extends SharedWorkerMessageTo ? T extends {kind: "add_node" | "add_edge" | "add_nodes_edges" | "remove_edge" | "set" | "undo" | "redo" | "remove_node"} ? T : never : never;
const isModifyingMessage = <T extends SharedWorkerMessageTo>(m: SharedWorkerMessageTo): m is ModifyingMessage<T> => ["add_node", "add_edge", "add_nodes_edges", "remove_edge", "delete", "set", "undo", "redo", "remove_node"].includes(m.kind)
const processMessage = (port: MessagePort, m: SharedWorkerMessageTo) =>
  (m.kind === "addPort"
    ? wrapPromise(initPort(m.port))
    : m.kind === "get"
    ? wrapPromise(store.refs.get(m.graphId))
      .then(graph => typedPostMessage(port, {kind: "get", messageId: m.messageId, graph}))
    : m.kind === "keys"
    ? wrapPromise(store.refs.keys())
      .then(keys => typedPostMessage(port, {kind: "keys", messageId: m.messageId, keys}))
    : m.kind === "add_node"
    ? wrapPromise(store.refs.add_node(m.graphId, m.node))
    : m.kind === "add_edge"
    ? wrapPromise(store.refs.add_edge(m.graphId, m.edge))
    : m.kind === "add_nodes_edges"
    ? wrapPromise(store.refs.add_nodes_edges(m))
    : m.kind === "set"
    ? wrapPromise(store.refs.set(m.graph.id, m.graph))
    : m.kind === "delete"
    ? wrapPromise(store.refs.delete(m.graphId))
    : wrapPromise(false))

    // .then(() => isModifyingMessage((console.log("checking", m, isModifyingMessage(m)), m)) 
    //   && ports.forEach(p => p !== port 
    //     && wrapPromise(store.refs.get(m.kind === "set" ? m.graph.id : m.graphId))
    //         .then(graph => typedPostMessage(p, {kind: "update", graph}))))

self.onerror = e => console.error("sharedworker error", e)

const initPort = (port: MessagePort) => {
  ports.push(port);

  port.addEventListener("message", (e) => {
    if(store) {
      processMessage(port, e.data)
    } else {
      initQueue.push([port, e.data]);
    }

    if(e.data.kind === "disconnect") {
      ports.splice(ports.indexOf(port), 1)
    }
  })

  port.start();

  port.postMessage({kind: "connect"})
}

self.onconnect = (e) => initPort(e.ports[0])

Promise.all([import("./editor/store"), import("./editor/automergeStore")]).then(([{webClientStore}, {automergeRefStore}]) => {
  webClientStore(nodysseusidb => automergeRefStore({nodysseusidb, persist: true}))
    .then(resStore => {
      store = resStore;
      initStore(store);
      initQueue.forEach(e => processMessage(e[0], e[1]));
    })
})
