import { IDBPDatabase, openDB, wrap } from "idb";
import custom_editor from "../custom_editor.json"
// import { IndexeddbPersistence } from "y-indexeddb";
// import * as Y from "yjs"
import generic from "../generic";
import { compare, mapStore, nolib, nolibLib} from "../nodysseus";
import { Edge, EdgeNoAs, EdgesIn, Graph, GraphNode, isNodeRef, NodysseusNode, NodysseusStore, NodysseusStoreTypes, RefNode, RefStore, Store, ValueNode } from "../types";
import { ancestor_graph, compareObjects, ispromise, mapMaybePromise, wrapPromise } from "../util";
import { hlib, EXAMPLES, hlibLib } from "./util";

import { createDo } from "typescript";
import {  expectSharedWorkerMessageResponse, RespondableSharedWorkerMessage, RespondableSharedWorkerMessageData, SharedWorkerMessageFrom, SharedWorkerMessageKind, SharedWorkerMessageTo, TRespondableSharedWorkerMessage, TSharedWorkerMessageFrom, TSharedWorkerMessageTo, TSharedWorkerMessageToData } from "./types";

const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));


export const addNode = (graph: Graph, node: NodysseusNode) => {
  if(graph.nodes[node.id]) {
    Object.keys(node).concat(Object.keys(graph.nodes[node.id]))
      .forEach(k => { 
        if(graph.nodes[node.id][k] !== node[k]) {
          if(node[k] === undefined) {
            delete graph.nodes[node.id][k]
          } else {
            graph.nodes[node.id][k] = node[k];
          }
        }
      })
  } else {
    Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
    graph.nodes[node.id] = node;
  }

  return graph
}

export const removeNode = node => doc => {
  const nodeid = typeof node === "string" ? node : node.id;
  delete doc.nodes[nodeid];
  delete doc.edges[nodeid];
  if(doc.edges_in) {
    Object.values(doc.edges_in).forEach(ein => {
      if(ein[nodeid]) {
        delete ein[nodeid]
      }
    })
  }
}


export const addEdge = (g: Graph, edge: Edge) => {
  g.edges[edge.from] = edge; 
  if(!g.edges_in) {
    g.edges_in = {};
    Object.values(g.edges).forEach((edge: Edge) => {
      if(g.edges_in[edge.to] ) {
        g.edges_in[edge.to][edge.from] = {...edge};
      } else {
        g.edges_in[edge.to] = {[edge.from]: {...edge}}
      }
    }) 
  }
  if(g.edges_in[edge.to] === undefined) g.edges_in[edge.to] = {};
  g.edges_in[edge.to][edge.from] = edge;

  return g
}


export const removeEdge = edge => g => {
  delete g.edges[edge.from]; 
  delete g.edges_in[edge.to][edge.from]
}

export const addNodesEdges = (graph: Graph, addedNodes: Array<NodysseusNode> = [], addedEdges: Array<Edge> = [], removedNodes: Array<NodysseusNode> = [], removedEdges: Array<EdgeNoAs> = []) => {
  removedNodes?.forEach(node => removeNode(node)(graph));
  removedEdges?.forEach(edge => removeEdge(edge)(graph));

  
  addedNodes.forEach(node => {
    Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
    graph.nodes[node.id] = node
  })

  addedEdges.forEach(edge => {
    graph.edges[edge.from] = edge;
    if(graph.edges_in[edge.to] ) {
      graph.edges_in[edge.to][edge.from] = {...edge};
    } else {
      graph.edges_in[edge.to] = {[edge.from]: {...edge}}
    }
  })

  return graph;
}




export const sharedWorkerRefStore = async (port: MessagePort): Promise<RefStore> => {
  const inflightRequests = new Map<string, (e: SharedWorkerMessageFrom) => void>();
  let connectres;
  const connectPromise = new Promise((res, rej) => connectres = res);
  port.onmessageerror = e => console.error("shared worker error", e);
  onerror = e => console.error("shared worker error", e);
  port.addEventListener('message', (e: MessageEvent<SharedWorkerMessageFrom>) =>
    e.data.kind === "connect" 
    ? connectres()
    : e.data.kind === "update"
    ? (nolib.no.runtime.change_graph(e.data.graph, nolibLib), contextGraphCache.set(e.data.graph.id, e.data.graph))
    : expectSharedWorkerMessageResponse(e.data) && inflightRequests.get(e.data.messageId)(e.data))
  self.addEventListener('beforeunload', () => port.postMessage({kind: "disconnect"}));
  port.start();

  await connectPromise;

  const sendMessage = (message: SharedWorkerMessageTo) =>
  {if(typeof (message as {graphId: any}).graphId === "object"){ debugger; } port.postMessage(message)}
  const messagePromise = <T extends SharedWorkerMessageKind>(request: RespondableSharedWorkerMessageData & TSharedWorkerMessageToData<T>): Promise<TSharedWorkerMessageFrom<T>> => {
    const message: TSharedWorkerMessageTo<T> & TRespondableSharedWorkerMessage<T> = {
      messageId: performance.now().toFixed(), 
      ...request
    }
    sendMessage(message);
    return new Promise((res, rej) => {
      inflightRequests.set(message.messageId, e => res(e as TSharedWorkerMessageFrom<T>));
    })
  }

  const contextGraphCache = new Map<string, Graph>();

  setTimeout(() =>
    nolib.no.runtime.addListener("graphchange", "__system-store", ({graph, source}) => {
      if(source === "automergeStore") {
        contextGraphCache.set(graph.id, graph)
      }
    })
  , 100);

  return {
      get: graphId => generic_nodes[graphId] ?? 
        contextGraphCache.get(graphId) ??
        messagePromise({kind: "get", graphId})
          .then(e => e.graph)
          .then(graph => (contextGraphCache.set(graphId, graph), graph))
      ,
      set: (k, g) => {
        sendMessage({kind: "set", graph: g})
        return g
      },
      delete: (k) => sendMessage({kind: "delete", graphId: k}),
      clear: () => {throw new Error("not implemented")},
      keys: () => messagePromise({kind: "keys"}).then(e => e.keys),
      add_edge: () => {throw new Error("not implemented")},
      remove_edge: () => {throw new Error("not implemented")},
      add_node: (graphId, node) => {
        sendMessage({kind: "add_node", graphId, node})
        const graphClone = structuredClone(contextGraphCache.get(graphId));
        contextGraphCache.set(graphId, addNode(graphClone, node));
      },
      remove_node: () => {throw new Error("not implemented")},
      add_nodes_edges: ({graphId, addedNodes, addedEdges, removedEdges, removedNodes}) => {
        sendMessage({kind: "add_nodes_edges", graphId, addedNodes, addedEdges, removedNodes, removedEdges})
        const graphClone = structuredClone(contextGraphCache.get(graphId));
        contextGraphCache.set(graphId, addNodesEdges(graphClone, addedNodes, addedEdges, removedNodes, removedEdges));
      }
  }
}

export const openNodysseusDB = () => openDB<NodysseusStoreTypes>("nodysseus", 4, {
    upgrade(db, oldVersion, newVersion) {
      if(oldVersion < 2) {
        db.createObjectStore("assets")
      } 

      if(oldVersion < 3) {
        db.createObjectStore("persist")
      }

      if(oldVersion < 4) {
        db.createObjectStore("refs")
      }
    }
  })

export const webClientStore = async (refStore: (idb: IDBPDatabase<NodysseusStoreTypes>) => Promise<RefStore>): Promise<NodysseusStore> => {
  const nodysseusidb = await openNodysseusDB();

  return {
    refs: await refStore(nodysseusidb),
    parents: mapStore(),
    state: mapStore(),
    fns: mapStore(),
    assets: {
      get: (id) => nodysseusidb.get('assets', id),
      set: (id, blob) => nodysseusidb.put('assets', blob, id),
      delete: id => nodysseusidb.delete('assets', id),
      clear: () => nodysseusidb.clear('assets'),
      keys: () => nodysseusidb.getAllKeys('assets').then(ks => ks.map(k => k.toString()))
    },
    persist: {
      get: (id) => nodysseusidb.get('persist', id),
      set: (id, str) => nodysseusidb.put('persist', str, id),
      delete: id => nodysseusidb.delete('persist', id),
      clear: () => nodysseusidb.clear('persist'),
      keys: () => nodysseusidb.getAllKeys('persist').then(ks => ks.map(k => k.toString()))
    }
  }
}
