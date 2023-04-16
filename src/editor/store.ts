import { IDBPDatabase, openDB, wrap } from "idb";
import custom_editor from "../custom_editor.json"
// import { IndexeddbPersistence } from "y-indexeddb";
// import * as Y from "yjs"
import generic from "../generic";
import { compare, mapStore, nolib } from "../nodysseus";
import { Edge, EdgesIn, Graph, GraphNode, NodysseusNode, NodysseusStore, RefNode, RefStore, Store } from "../types";
import { ancestor_graph, compareObjects, ispromise, mapMaybePromise, wrapPromise } from "../util";
import { hlib } from "./util";
// import Loki from "lokijs"
// import {WebrtcProvider} from "y-webrtc";
// import { YMap } from "yjs/dist/src/internals";
// import {createRxDatabase} from "rxdb"
// import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import * as Automerge from "@automerge/automerge";
import {v4 as uuid, parse as uuidparse, stringify as uuidstringify} from "uuid";
import { javascript } from "@codemirror/lang-javascript";

// type SyncedGraph = {
//   remoteProvider: WebrtcProvider,
  // remoteProvider: WebrtcProvider,
//   idb: IndexeddbPersistence,
//   graph: Graph,
//   undoManager: Y.UndoManager
// }


const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

// const setMapFromGraph = (infomap, data) => {
//   infomap.doc.transact(() => {
//       if(infomap.get("name") !== data.name) {
//         infomap.set("name", data.name);
//       }
//       if(data.ref && data.ref !== infomap.get("ref")){
//         infomap.set("ref", data?.ref);
//       } else if(infomap.has('ref') && !data.ref) {
//         infomap.delete('ref')
//       }
//
//       if(data.value && data.value !== infomap.get("value")){
//         infomap.set("value", data?.value);
//       } else if(infomap.has('value') && !data.value) {
//         infomap.delete('value')
//       }
//
//       if(data.out && data.out !== infomap.get("out")){
//         infomap.set("out", data?.out);
//       } else if(infomap.has('out') && !data.out) {
//         infomap.delete('out')
//       }
//
//       if(data.nodes)  {
//         let nodesymap: Y.Map<Node> = infomap.get("nodes")
//         if(!infomap.get("nodes")?.set) {
//           nodesymap = new Y.Map();
//           infomap.set("nodes", nodesymap)
//         }
//         if(Array.isArray(data.nodes)){
//           nodesymap.clear();
//           data.nodes.map(n => nodesymap.set(n.id, n)) 
//         } else {
//           Object.entries(data.nodes).forEach((kv: [string, Node]) => !compare(nodesymap.get(kv[0]), kv[1]) && nodesymap.set(kv[0], kv[1]))
//           nodesymap.forEach((node, key) => {
//             if(!data.nodes[key]) {
//               nodesymap.delete(key)
//             }
//           })
//         } 
//       }
//
//       if(data.edges) {
//         let edgesymap: Y.Map<Edge> = infomap.get("edges")
//         if(!infomap.get("edges")?.set) {
//           edgesymap = new Y.Map();
//           infomap.set("edges", edgesymap)
//         }
//
//         edgesymap.clear();
//
//         if(Array.isArray(data.edges)){
//           const edgeset = new Set(data.edges.map(e => e.from))
//           if(edgeset.size !== data.edges.length) {
//             console.log(`invalid edges for ${data.id}`)
//             console.log(data.edges.filter(e => {
//               edgeset.has(e.from) ? edgeset.delete(e.from) : console.log(e.from)
//             }))
//           }
//           data.edges.map(e => edgesymap.set(e.from, e)) 
//         } else {
//           Object.entries(data.edges).forEach((kv: [string, Edge]) => !compare(edgesymap.get(kv[0]), kv[1]) && edgesymap.set(kv[0], kv[1]))
//           edgesymap.forEach((edge, key) => {
//             if(!data.edges[key]) {
//               edgesymap.delete(key)
//             }
//           })
//         } 
//       }
//   })
// }

// export const ydocStore = async ({ persist = false, rtcpolyfill = undefined, update = undefined }: {
//   persist: false | string,
//   rtcpolyfill: any,
//   update: undefined | ((evt: Y.YMapEvent<Y.Map<Y.Doc>>, id?: string) => void)
// }) => {
//   // Stores ydoc (local) and rdoc (remote) so that documents live in the same document tree
//   const rootDoc = new Y.Doc();
//
//   // Stores graphs locally using abstract types
//   const ydoc = new Y.Doc();
//   rootDoc.getMap().set("ydoc", ydoc);
//   const ymap: Y.Map<Y.Doc> = ydoc.getMap();
//   const getLocalGraphYMap = (id: string) => ymap.get(id).getMap()
//   ydoc.on('subdocs', e => {
//     e.loaded.forEach((sd: Y.Doc) => {
//         sd.emit('load', [sd])
//         //
//         // const id = sdmap.get("id") as string;
//         //
//         // updateSyncedGraph(id, {localDoc: sd})
//     })
//   })
//
//   // Syncs graphs with remote peers
//   const rdoc = new Y.Doc({autoLoad: true})
//   rootDoc.getMap().set("rdoc", rdoc)
//   const rmap: Y.Map<string> = rdoc.getMap();
//
//   const syncedGraphs = new Map<string, SyncedGraph | Promise<SyncedGraph>>();
//
//
//   // Observe ymap and call the passed in update. Used for calling change_graph to update nodysseus state
//   let undoManager;
//
//
//   // Add a graph
//   const set = (id: string, data: Graph): Promise<Graph> => {
//     if(generic_node_ids.has(id)) {
//       generic_nodes[id].edges_in = Object.values(generic_nodes[id].edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
//       return generic_nodes[id];
//     } else if(id && !id.startsWith("_") && Object.keys(data).length > 0) {
//       return Promise.resolve(wrapPromise(updateSyncedGraph(id, data)).then(sg => sg.graph).value);
//     }
//   }
//
//
//   const add_nodes_edges = (graphId, nodes, edges, remove_edges, remove_nodes) => {
//     if(generic_node_ids.has(graphId)) return;
//
//     ymap.get(graphId).transact(() => {
//       remove_nodes.forEach(node => (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).delete(typeof node === "string" ? node : node.id));
//       remove_edges.forEach(edge => (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(edge.from));
//       nodes.forEach(node => (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).set(node.id, node));
//       edges.forEach(edge => (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).set(edge.from, edge));
//     })
//
//     updateSyncedGraph(graphId)
//   }
//
//   const add_node = (graphId, node) => {
//     if(generic_node_ids.has(graphId)) return;
//
//     ymap.get(graphId).transact(() => {
//       (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).set(node.id, node)
//     })
//
//     updateSyncedGraph(graphId)
//   }
//
//   const remove_node = (graphId, node) => {
//     if(generic_node_ids.has(graphId)) return;
//
//     ymap.get(graphId).transact(() => {
//       (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
//       (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
//     })
//
//     updateSyncedGraph(graphId)
//   }
//
//   const add_edge = (graphId, edge) => {
//     if(generic_nodes[graphId]) return;
//
//     ymap.get(graphId).transact(() => {
//       (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).set(edge.from, edge)
//     })
//
//     updateSyncedGraph(graphId)
//   }
//
//   const remove_edge = (graphId, edge) => {
//     ymap.get(graphId).transact(() => {
//       (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(edge.from)
//     })
//
//     updateSyncedGraph(graphId)
//   }
//
//   if(persist !== undefined) {
//     const indexeddbProvider = new IndexeddbPersistence(`${persist}-subdocs`, ydoc)
//     await indexeddbProvider.whenSynced
//   }
//
//
//   const updateSyncedGraph = (id: string, graph?: Graph): {graph: undefined} | SyncedGraph | Promise<SyncedGraph> => 
//     wrapPromise(id !== "custom_editor" && id !== "keybindings" && rtcroom)
//     .then(rtcroom => wrapPromise(syncedGraphs.get(id)).then(existing => ({existing, rtcroom})).value)
//     .then(({existing, rtcroom}) => {
//       const syncedGraph: {graph: undefined} | SyncedGraph | Promise<SyncedGraph> = wrapPromise(existing && ymap.has(id) ? existing : Promise.resolve(existing)).then(() => {
//         let preloadDoc = ymap.get(id);
//
//         if(!existing && !preloadDoc && !graph && !rmap.has(id)) {
//           return {graph: undefined}
//         }
//
//         let unloadedRdoc = false;
//         // Need to create indexeddbpersistence even if the preloaddoc is generated
//         let createdPreload = false;
//
//         // create the preloaddoc before syncing with rtcroom
//         if(!preloadDoc) {
//           createdPreload = true;
//           preloadDoc = new Y.Doc( rmap.has(id) ? {guid: rmap.get(id)} : undefined);
//           preloadDoc.getMap().set("id", id)
//           if(graph) {
//             setMapFromGraph(preloadDoc.getMap(), graph)
//           } else {
//             unloadedRdoc = true;
//           }
//           ymap.set(id, preloadDoc);
//         } else if(graph) {
//           setMapFromGraph(preloadDoc.getMap(), graph)
//         }
//         
//         if(rtcroom && preloadDoc && !rmap.has(id)) {
//           rmap.set(id, preloadDoc.guid)
//         }
//
//         if(!preloadDoc.isLoaded) {
//           preloadDoc.load();
//         }
//
//
//         // see note above createdPreload
//         return (!createdPreload && preloadDoc.isLoaded && existing ? wrapPromise({localDoc: preloadDoc, idb: undefined})
//             : wrapPromise(existing && !unloadedRdoc ? existing : Promise.resolve(existing))
//               .then(() => new IndexeddbPersistence(`${persist}-subdocs-${preloadDoc.guid}`, preloadDoc).whenSynced.then(idb =>{
//                 if(preloadDoc.getMap().get("nodes") && !createdPreload) {
//                   preloadDoc.transact(() => {
//                     // Sanitization and transforming from old to new
//                     const edgeReplaceMap = new Map<string, Map<string, string>>();
//                     let updateEdges = false;
//                     const docmap = preloadDoc.getMap();
//                     const docnodes: Y.Map<NodysseusNode> = docmap.get("nodes") as Y.Map<NodysseusNode>;
//                     (docmap.get("edges") as (Y.Map<Edge> | Y.Map<Y.Map<string>>)).forEach((e: Edge | Y.Map<string>, key: string) => {
//                       let edge = e as Edge
//                       if(edge.from && edge.to) {
//                         updateEdges = true;
//                         if(docnodes.has(edge.from) && docnodes.has(edge.to)) {
//                           if(!edgeReplaceMap.has(edge.to)) {
//                             edgeReplaceMap.set(edge.to, new Map())
//                           }
//
//                           edgeReplaceMap.get(edge.to).set(edge.as, edge.from)
//                         } else if(!docnodes.has(edge.from)) {
//                           docnodes.set(edge.from, {id: edge.from})
//                         } else if(!docnodes.has(edge.to)) {
//                           docnodes.set(edge.to, {id: edge.to})
//                         }
//                       } else if(edge.from || edge.to) {
//                         // remove_edge(id, edge);
//                       } else {
//                         (e as Y.Map<string>).forEach((as, from) => {
//                           if(!(docnodes.has(key) && docnodes.has(from))) {
//                             throw new Error(`invalid edge ${from} to ${key} as ${as}`)
//                           }
//                         })
//                       }
//                     })
//
//
//                     if(updateEdges) {
//                       // console.log("would update", edgeReplaceMap)
//                     }
//                   })
//                 }
//
//                 // Hook undoManager invisibly to persistence
//                 const undoManager = new Y.UndoManager(preloadDoc.getMap());
//                 getLocalGraphYMap(id).observeDeep(events => events.forEach(event => {
//                   if(event.transaction.local === false || event.transaction.origin === undoManager) {
//                     update(event as Y.YMapEvent<YMap<Y.Doc>>, id)
//                     updateSyncedGraph(id)
//                   }
//                 }))
//
//                 return {localDoc: preloadDoc, idb, undoManager}
//               })))
//
//               .then(({localDoc, idb, undoManager}) => {
//                 if(graph) {
//                     graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
//
//                     if(!(existing?.graph && compareObjects(graph, existing.graph))) {
//                       syncedGraphs.set(id, {...existing, graph})
//                       nolib.no.runtime.publish('graphchange', graph, {...nolib, ...hlib}) 
//                     }
//
//                     return syncedGraphs.get(id);
//                 } else {
//                   const graph = localDoc.getMap().toJSON() as Graph;
//                   if(graph.nodes) {
//                     graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
//                     nolib.no.runtime.publish('graphchange', graph, {...nolib, ...hlib}) 
//                   }
//                   const updatedExisting = syncedGraphs.get(id);
//                   return {
//                     graph,
//                     idb: idb ?? existing?.idb,
//                     undoManager: undoManager ?? existing.undoManager,
//                  remoteProvider: rtcroom && (existing?.remoteProvider ?? (updatedExisting as SyncedGraph)?.remoteProvider 
//                      ?? new WebrtcProvider(`nodysseus${rtcroom}_${localDoc.guid}`, localDoc, {
//                       signaling: ["wss://ws.nodysseus.io"],
//                       filterBcConns: true,
//                       password: undefined,
//                       awareness: undefined,
//                       maxConns: undefined,
//                       peerOpts: {
//                         config: {
//                           iceServers: [
//                             {urls: "stun:ws.nodysseus.io:3478"}
//                           ]
//                         },
//                         wrtc: rtcpolyfill
//                       }
//                         }))
//                   }
//                 }
//               }).then(sg => {
//                 syncedGraphs.set(id, sg)
//                 return sg;
//               }).value
//         }).value;
//
//         if(ispromise(syncedGraph) || syncedGraph.graph) {
//           syncedGraphs.set(id, syncedGraph as SyncedGraph)
//         }
//
//         return syncedGraph
//     }).value;
//
//   // grab rtcroom after the initial load of indexeddb
//   let rtcroom = wrapPromise(updateSyncedGraph("custom_editor"))
//     .then(sg => sg.graph)
//     .then(custom_editor => !!custom_editor && hlib.run(custom_editor, custom_editor.out ?? "out"))
//     .then(custom_editor_result => {
//       rtcroom = custom_editor_result?.rtcroom || false;
//
//       if(rtcroom) {
//         new WebrtcProvider(`nodysseus${rtcroom}_subdocs`, rdoc, {
//           signaling: ["wss://ws.nodysseus.io"],
//           password: undefined,
//           awareness: undefined,
//           filterBcConns: true,
//           maxConns: undefined,
//           peerOpts: {
//             config: {
//               iceServers: [
//                 {urls: "stun:ws.nodysseus.io:3478"}
//               ]
//             },
//             wrtc: rtcpolyfill
//           }
//         })
//         // new WebsocketProvider("wss://ws.nodysseus.io", `nodysseus${rtcroom}_subdocs`, rdoc)
//
//         rdoc.getMap().observe(evts => {
//           evts.keysChanged.forEach(k => {
//             requestAnimationFrame(() => updateSyncedGraph(k))
//           })
//         })
//       }
//
//       return rtcroom;
//     }).value
//
//   if(update !== undefined) {
//     ymap.observeDeep(events =>{
//       events.forEach((event: Y.YMapEvent<typeof ymap>) => {
//         if(!event.transaction.local || event.transaction.origin === undoManager) {
//           update(event)
//         }
//
//         for(let k of event.keysChanged) {
//           // Don't readd deleted things
//           if(event.target.get(k)) {
//             updateSyncedGraph(k);
//           }
//         }
//       })
//     })
//   }
//
//   const get = (id) => {
//     if(generic_node_ids.has(id)) {
//       return generic_nodes[id];
//     }
//
//     return wrapPromise(syncedGraphs.get(id))
//       .then(syncedGraph => syncedGraph ?? updateSyncedGraph(id))
//       .then(syncedGraph => syncedGraph?.graph).value;
//
//     // TODO: if rdoc has it and it's not synced, what then?
//   }
//
//   return {
//     get,
//     set,
//     add_node,
//     remove_node,
//     add_nodes_edges,
//     add_edge,
//     remove_edge,
//     delete: id => {
//       console.log(`removing ${id}`)
//       return wrapPromise(syncedGraphs.get(id))
//         .then(syncedGraph => {
//           syncedGraph?.idb?.clearData();
//           syncedGraphs.delete(id);
//           ymap.get(id)?.destroy();
//           ymap.delete(id);
//           rmap.delete(id);
//         }).value
//     },
//     clear: () => {
//       throw new Error("Can't remove all refs")
//     },
//     keys: () => {
//       const keys = [...ymap.keys(), ...Object.keys(generic_nodes)];
//       return keys//.map(v => get(v))
//     },
//     undo: persist && ((id: string) => wrapPromise(syncedGraphs.get(id)).then(syncedGraph => syncedGraph?.undoManager?.undo())),
//     redo: persist && ((id: string) => wrapPromise(syncedGraphs.get(id)).then(syncedGraph => syncedGraph?.undoManager?.redo())),
//   }
// }
//
// export const yNodyStore = async (rtcpolyfill?: any): Promise<NodysseusStore> => {
//   const statedb = mapStore<{id: string, data: Record<string, any>}>();
//
//   let nodysseusidb;
//
//   await openDB("nodysseus", 3, {
//     upgrade(db, oldVersion, newVersion) {
//       if(oldVersion < 2) {
//         db.createObjectStore("assets")
//       } 
//
//       if(oldVersion < 3) {
//         db.createObjectStore("persist")
//       }
//     }
//   }).then(db => { nodysseusidb = db })
//
//   return {
//     refs: await ydocStore({
//       persist: 'refs', 
//       rtcpolyfill, 
//       update: (event, id) => {
//         // console.log(`update event`)
//         // console.log(event);
//         if(!id && event.keysChanged.size > 1) {
//           return;
//         }
//
//         const updatedgraph = id ?? (event.currentTarget as YMap<any>).get("id");
//         if(updatedgraph !== undefined) {
//           requestAnimationFrame(() =>  {
//             // console.log(updatedgraph);
//             // console.log(nolib.no.runtime.get_ref(updatedgraph))
//             nolib.no.runtime.change_graph(nolib.no.runtime.get_ref(updatedgraph), {...nolib, ...hlib}, event.transaction.local)
//           }) 
//         }
//       }
//     }),
//     parents: mapStore(),
//     state: mapStore(),
//     fns: mapStore(),
//     assets: {
//       get: (id) => nodysseusidb.get('assets', id),
//       set: (id, blob) => nodysseusidb.put('assets', blob, id),
//       delete: id => nodysseusidb.delete('assets', id),
//       clear: () => nodysseusidb.clear('assets'),
//       keys: () => nodysseusidb.getAllKeys('assets')
//     },
//     persist: {
//       get: (id) => nodysseusidb.get('persist', id),
//       set: (id, str) => nodysseusidb.put('persist', str, id),
//       delete: id => nodysseusidb.delete('persist', id),
//       clear: () => nodysseusidb.clear('persist'),
//       keys: () => nodysseusidb.getAllKeys('persist')
//     }
//   }
// }


// export const rxdbStore = async (): Promise<NodysseusStore> => {
//   const statedb = mapStore<{id: string, data: Record<string, any>}>();
//
//   let nodysseusidb;
//
//   await openDB("nodysseus", 3, {
//     upgrade(db, oldVersion, newVersion) {
//       if(oldVersion < 2) {
//         db.createObjectStore("assets")
//       } 
//
//       if(oldVersion < 3) {
//         db.createObjectStore("persist")
//       }
//     }
//   }).then(db => { nodysseusidb = db })
//
//   const refsdb = await createRxDatabase({
//     name: 'testdb',
//     storage: getRxStorageMemory()
//   })
//
//   const refschema = {
//     title: 'refs schema',
//     version: 0,
//     primaryKey: 'id',
//     type: 'object',
//     required: ['id', 'nodes', 'edges'],
//     properties: {
//       id: {
//         type: 'string',
//         maxLength: 32
//       },
//       out: {
//         type: 'string'
//       },
//       name: {
//         type: 'string'
//       },
//       nodes: {
//         type: 'object',
//         properties: {
//           additionalProperties: {
//             type: "object",
//             additionalProperties: true
//           }
//         }
//       },
//       edges: {
//         type: 'object',
//         properties: {
//           additionalProperties: {
//             type: 'object',
//             properties: {
//               to: {type: 'string'},
//               from: {type: 'string'},
//               ad: {type: 'string'}
//             }
//           }
//         }
//       },
//       edges_in: {
//         type: 'object',
//         properties: {
//           additionalProperties: {
//             type: 'object',
//             properties: {
//               additionalProperties: {
//                 type: 'object',
//                 properties: {
//                   to: {type: 'string'},
//                   from: {type: 'string'},
//                   ad: {type: 'string'}
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
//
//   await refsdb.addCollections({
//     refs: {
//       schema: refschema
//     }
//   })
//   const refs = {
//       get: (id) => refsdb.refs.findOne(id).exec(),
//       set: (id, graph) => refsdb.refs.upsert(graph),
//       delete: (id) => {throw new Error("not implemented")},
//       clear: () => {throw new Error("not implemented")},
//       keys: () => {return []},
//       undo: () => {throw new Error("not implemented")},
//       redo: () => {throw new Error("not implemented")},
//       add_node: (id, node) => refs.get(id).then(d => d.modify(g => {g.nodes[node.id] = node; return g})),
//       add_nodes_edges: (id, nodes) => {throw new Error("not implemented")},
//       remove_node: (id, node) => refs.get(id).then(d => d.modify(g => {delete g.nodes[node.id]; return g})),
//       add_edge: (id, edge) => refs.get(id).then(d => d.modify(g => {g.edges[edge.from] = edge; g.edges_in[edge.to][edge.from] = edge; return g})),
//       remove_edge: (id, edge) => refs.get(id).then(d => d.modify(g => {delete g.edges[edge.id]; return g})),
//     }
//   refs.get("custom_editor").then(ce => {
//     if (!ce) {
//       refs.set("custom_editor", generic.nodes["simple"])
//     }
//   })
//
//   return {
//     refs,
//     parents: mapStore(),
//     state: mapStore(),
//     fns: mapStore(),
//     assets: {
//       get: (id) => nodysseusidb.get('assets', id),
//       set: (id, blob) => nodysseusidb.put('assets', blob, id),
//       delete: id => nodysseusidb.delete('assets', id),
//       clear: () => nodysseusidb.clear('assets'),
//       keys: () => nodysseusidb.getAllKeys('assets')
//     },
//     persist: {
//       get: (id) => nodysseusidb.get('persist', id),
//       set: (id, str) => nodysseusidb.put('persist', str, id),
//       delete: id => nodysseusidb.delete('persist', id),
//       clear: () => nodysseusidb.clear('persist'),
//       keys: () => nodysseusidb.getAllKeys('persist')
//     }
//   }
// }
//
//
// export const sharedWorkerStore = async (): Promise<NodysseusStore> => {
//   const refsset = new Set();
//   const refsmap = new Map();
//
//   const sharedWorker = new SharedWorker("./shared-worker.js", {type: "module"})
//
//
//   const refs: RefStore = {
//     get: id => {
//         if(generic_node_ids.has(id)) {
//           return generic_nodes[id];
//         }
//
//         if(!refsmap.get(id) && refsset.has(id)) {
//           return nodysseusidb.get("refs", id)
//             .then(persisted => {
//               if(persisted) {
//                 let doc = Automerge.load<Graph>(persisted)
//                 refsmap.set(id, doc);
//                 updatePeers(id);
//                 return doc;
//               }
//             })
//         }
//
//
//         return refsmap.get(id)
//     },
//     set: (id, graph) => sharedWorker.port.postMessage()
//
//   }
//
// }


export const automergeStore = async ({persist} = { persist: false }): Promise<NodysseusStore> => {
  const nodysseusidb = await openDB("nodysseus", 4, {
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

  const refsmap = new Map<string, Automerge.Doc<Graph>>();
  const structuredCloneMap = new Map<string, Graph>();
  const refsset = new Set(await nodysseusidb.getAllKeys("refs").then(ks => ks.map(k => k.toString())));


  /////
  // Fns
  //

  const updatePeers = (id: string) => {
    if(id === "custom_editor") return;

    if(updatePeersDebounces[id]) cancelAnimationFrame(updatePeersDebounces[id])
    updatePeersDebounces[id] = requestAnimationFrame(() => {
      wrapPromise(refsmap.get(id)).then(current => {
        updatePeersDebounces[id] = false;
        Object.entries(syncStates).forEach(([peer, syncState]) => {
          const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
            current,
            syncState[id] || Automerge.initSyncState()
          )
          syncStates[peer] = {...syncStates[peer], [id]: nextSyncState};
          if(syncMessage) {
            if(syncStates[peer]._syncType === "broadcast") {
              syncBroadcast.postMessage({type: "syncgraph", id, peerId, target: peer, syncMessage});
            } else if(syncStates[peer]._syncType === "ws") {
              syncWS.send(new Blob([Uint8Array.of(syncMessageTypesRev["syncgraph"]), uuidparse(peerId), uuidparse(peer), id.padEnd(128, " "), syncMessage]))
            }
          }
        })
      })
    })
  }

  // Gets the actual automerge doc - for this store only
  // For any outside interaction, do a structured clone.
  const getDoc = id => {
    if(!refsmap.get(id) && refsset.has(id)) {
      return nodysseusidb.get("refs", id)
        .then(persisted => {
          if(persisted) {
            let doc = Automerge.load<Graph>(persisted)
            refsmap.set(id, doc);
            structuredCloneMap.set(id, structuredClone(doc));
            updatePeers(id);
            return doc;
            // TODO: validate graphs on load - this doesn't work because the automerge docs change.
            // const filteredGraph = ancestor_graph(doc.out, doc, nolib);
            // return refs.set(id, filteredGraph);
          }
        })
    }

    // console.log(Automerge.getHeads(refsmap.get(id)))

    return refsmap.get(id);
  }


  const changeDoc = (id, fn) =>
    wrapPromise(getDoc(id))
      .then(graph => {
        let doc = Automerge.change<Graph>(graph ?? Automerge.init<Graph>(), fn);
        if(!doc.edges_in) {
          doc = Automerge.change<Graph>(doc, d => {
            d.edges_in = {};
            Object.values(d.edges).forEach(edge => {
              if(d.edges_in[edge.to] ) {
                d.edges_in[edge.to][edge.from] = {...edge};
              } else {
                d.edges_in[edge.to] = {[edge.from]: {...edge}}
              }
            }) 
          })
        }
        persist && nodysseusidb.put("refs", Automerge.save(doc), id)
        refsmap.set(id, doc);
        refsset.add(id);
        updatePeers(id);
        const scd = structuredClone(doc);
        structuredCloneMap.set(id, scd)
        return scd;
      }).value

  const removeNodeFn = node => doc => {
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

  const removeEdgeFn = edge => g => {
    delete g.edges[edge.from]; 
    delete g.edges_in[edge.to][edge.from]
  }


  const refs: RefStore = {
      get: (id) => {
        return generic_nodes[id] ?? (structuredCloneMap.has(id) 
          ? structuredCloneMap.get(id) 
          : wrapPromise(getDoc(id))
            .then(d => {
              const scd = structuredClone(d);
              structuredCloneMap.set(id, scd);
              return scd;
            }).value);
      },
      set: (id, graph) => changeDoc(id, doc => Object.entries(structuredClone(graph)).forEach(e => e[1] !== undefined && (doc[e[0]] = e[1]))),
      delete: (id) => {
        refsmap.delete(id);
        refsset.delete(id);
        return nodysseusidb.delete("refs", id);
      },
      clear: () => {throw new Error("not implemented")},
      keys: () => {return [...refsset.keys(), ...generic_node_ids]},
      undo: () => {throw new Error("not implemented")},
      redo: () => {throw new Error("not implemented")},
      add_node: (id, node) => changeDoc(id, doc => {
        Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
        doc.nodes[node.id] = node;
      }),
      add_nodes_edges: (id, nodes, edges, remove_edges, remove_nodes) => changeDoc(id, graph => {
        remove_nodes?.forEach(node => removeNodeFn(node)(graph));
        remove_edges?.forEach(edge => removeEdgeFn(edge)(graph));

        
        nodes.forEach(node => {
          Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
          graph.nodes[node.id] = node
        })

        edges.forEach(edge => {
          graph.edges[edge.from] = edge;
          if(graph.edges_in[edge.to] ) {
            graph.edges_in[edge.to][edge.from] = {...edge};
          } else {
            graph.edges_in[edge.to] = {[edge.from]: {...edge}}
          }
        })

      }),
      remove_node: (id, node) => changeDoc(id, removeNodeFn(node)),
      add_edge: (id, edge) => changeDoc(id, g => {
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
      }),
      remove_edge: (id, edge) => changeDoc(id, removeEdgeFn(edge))
    }

  /////
  // Stateful



  if(!refs.get("custom_editor")){
    refs.set("custom_editor", custom_editor)
  }


  const syncMessageTypes = {
    0: "syncstart",
    1: "syncgraph"
  }
  const syncMessageTypesRev = {
    syncstart: 0,
    syncgraph: 1
  }

  const syncBroadcast = new BroadcastChannel("refssync");
  const syncStates = {};

  const peerId = uuid();


  syncBroadcast.postMessage({type: "syncstart", peerId})

  syncBroadcast.addEventListener("message", v => {
    const data = v.data;
    if(data.type === "syncstart" && syncStates[data.peerId]?._syncType !== "broadcast" && data.peerId !== peerId) {
      syncStates[data.peerId] = {_syncType: "broadcast"};
      syncBroadcast.postMessage({type: "syncstart", peerId})
    } else if (data.type === "syncgraph" && data.target === peerId) {
      wrapPromise(getDoc(data.id)).then(currentDoc => {
        const id = data.id;
        currentDoc = currentDoc ?? Automerge.init<Graph>();
        const [nextDoc, nextSyncState, patch] = Automerge.receiveSyncMessage<Graph>(
          currentDoc, 
          syncStates[data.peerId]?.[id] || Automerge.initSyncState(), 
          data.syncMessage
        , {
          patchCallback: (patches, before, after) => {
            const nodes = []
            patches.forEach(patch => {
              if(patch.path[0] === "nodes") {
                nodes.push(patch.path[1])
              }
            })
            if(nodes.length > 0) {
              nolib.no.runtime.change_graph(after, {...nolib, ...hlib}, []) 
            }
          }
        });
        refsset.add(id);
        refsmap.set(id, nextDoc);
        persist && nodysseusidb.put("refs", Automerge.save(nextDoc), id)
        structuredCloneMap.set(id, structuredClone(nextDoc));
        syncStates[data.peerId] = {...syncStates[data.peerId], [id]: nextSyncState};

        const graph = refs.get(id);

        nolib.no.runtime.publish('graphchange', {graph}, {...nolib, ...hlib}) 
        updatePeers(id);
      })
    }
  })

  let syncWS;

  wrapPromise(getDoc("custom_editor"))
    .then(ce => hlib.run(ce, ce.out ?? "out"))
    .then(cer => cer.rtcroom )
    .then(rtcroom => {
      if(!rtcroom) return;

    syncWS = new WebSocket(`wss://ws.nodysseus.io/${rtcroom}`);
    syncWS.addEventListener("open", () => {
      syncWS.send(new Blob([Uint8Array.of(syncMessageTypesRev["syncstart"]), uuidparse(peerId)]))
    })

    syncWS.addEventListener("message", (ev: MessageEvent) => {
      ev.data.arrayBuffer().then(evbuffer => {
        const uintbuffer = new Uint8Array(evbuffer);
      const messageType = syncMessageTypes[uintbuffer[0]];
      const data = {
        type: messageType,
        peerId: uuidstringify(uintbuffer.subarray(1, 17)),
        target: messageType === "syncgraph" && uuidstringify(uintbuffer.subarray(17, 33)),
        id: new TextDecoder().decode(uintbuffer.subarray(33, 161)).trimEnd(),
        syncMessage: messageType === "syncgraph" && uintbuffer.subarray(161),
      };
      if(data.type === "syncstart" && !syncStates[data.peerId] && data.peerId !== peerId) {
        syncStates[data.peerId] = {_syncType: "ws"};
        syncWS.send(new Blob([Uint8Array.of(syncMessageTypesRev["syncstart"]), uuidparse(peerId)]))
      } else if (data.type === "syncgraph" && data.target === peerId) {
        const id = data.id;
        wrapPromise(getDoc(id)).then(current => {
          data.syncMessage = Uint8Array.from(Object.values(data.syncMessage))
          const [nextDoc, nextSyncState, patch] = Automerge.receiveSyncMessage(current ?? Automerge.init<Graph>(), syncStates[data.peerId]?.[id] || Automerge.initSyncState(), data.syncMessage, {
            patchCallback: (patches, before, after) => {
            const nodes = []
            patches.forEach(patch => {
              if(patch.path[0] === "nodes") {
                nodes.push(patch.path[1])
              }
            })
            if(nodes.length > 0) {
              nolib.no.runtime.change_graph(after, {...nolib, ...hlib}, []) 
            }
            }
          });
          refsmap.set(id, nextDoc);
          refsset.add(id);
          persist && nodysseusidb.put("refs", Automerge.save(nextDoc), id)
          structuredCloneMap.set(id, structuredClone(nextDoc));
          syncStates[data.peerId] = {...syncStates[data.peerId], [id]: nextSyncState};

          const graph = refs.get(id);

          nolib.no.runtime.publish('graphchange', {graph}, {...nolib, ...hlib}) 
          updatePeers(id);
        })
      }
    })
    })
  })

  let updatePeersDebounces = {};

  return {
    refs,
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


