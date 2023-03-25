import { openDB, wrap } from "idb";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs"
import generic from "../generic";
import { compare, lokidbToStore, mapStore, nolib } from "../nodysseus";
import { Edge, EdgesIn, Graph, NodysseusNode, NodysseusStore, Store } from "../types";
import { compareObjects, ispromise, mapMaybePromise, wrapPromise } from "../util";
import { hlib } from "./util";
import Loki from "lokijs"
import {WebrtcProvider} from "y-webrtc";
import { YMap } from "yjs/dist/src/internals";


type SyncedGraph = {
  remoteProvider: WebrtcProvider,
  idb: IndexeddbPersistence,
  graph: Graph
}


const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

const setMapFromGraph = (infomap, data) => {
  infomap.doc.transact(() => {
      if(infomap.get("name") !== data.name) {
        infomap.set("name", data.name);
      }
      if(data.ref && data.ref !== infomap.get("ref")){
        infomap.set("ref", data?.ref);
      } else if(infomap.has('ref') && !data.ref) {
        infomap.delete('ref')
      }

      if(data.value && data.value !== infomap.get("value")){
        infomap.set("value", data?.value);
      } else if(infomap.has('value') && !data.value) {
        infomap.delete('value')
      }

      if(data.out && data.out !== infomap.get("out")){
        infomap.set("out", data?.out);
      } else if(infomap.has('out') && !data.out) {
        infomap.delete('out')
      }

      if(data.nodes)  {
        let nodesymap: Y.Map<Node> = infomap.get("nodes")
        if(!infomap.get("nodes")?.set) {
          nodesymap = new Y.Map();
          infomap.set("nodes", nodesymap)
        }
        if(Array.isArray(data.nodes)){
          nodesymap.clear();
          data.nodes.map(n => nodesymap.set(n.id, n)) 
        } else {
          Object.entries(data.nodes).forEach((kv: [string, Node]) => !compare(nodesymap.get(kv[0]), kv[1]) && nodesymap.set(kv[0], kv[1]))
          nodesymap.forEach((node, key) => {
            if(!data.nodes[key]) {
              nodesymap.delete(key)
            }
          })
        } 
      }

      if(data.edges) {
        let edgesymap: Y.Map<Edge> = infomap.get("edges")
        if(!infomap.get("edges")?.set) {
          edgesymap = new Y.Map();
          infomap.set("edges", edgesymap)
        }

        edgesymap.clear();

        if(Array.isArray(data.edges)){
          const edgeset = new Set(data.edges.map(e => e.from))
          if(edgeset.size !== data.edges.length) {
            console.log(`invalid edges for ${data.id}`)
            console.log(data.edges.filter(e => {
              edgeset.has(e.from) ? edgeset.delete(e.from) : console.log(e.from)
            }))
          }
          data.edges.map(e => edgesymap.set(e.from, e)) 
        } else {
          Object.entries(data.edges).forEach((kv: [string, Edge]) => !compare(edgesymap.get(kv[0]), kv[1]) && edgesymap.set(kv[0], kv[1]))
          edgesymap.forEach((edge, key) => {
            if(!data.edges[key]) {
              edgesymap.delete(key)
            }
          })
        } 
      }
  })
}

export const ydocStore = async ({ persist = false, useRtc = false, update = undefined }: {
  persist: false | string,
  useRtc: boolean,
  update: undefined | ((evt: Y.YMapEvent<Y.Map<Y.Doc>>, id?: string) => void)
}) => {
  // Stores ydoc (local) and rdoc (remote) so that documents live in the same document tree
  const rootDoc = new Y.Doc();

  // Stores graphs locally using abstract types
  const ydoc = new Y.Doc();
  rootDoc.getMap().set("ydoc", ydoc);
  const ymap: Y.Map<Y.Doc> = ydoc.getMap();
  const getLocalGraphYMap = (id: string) => ymap.get(id).getMap()
  ydoc.on('subdocs', e => {
    e.loaded.forEach((sd: Y.Doc) => {
        sd.emit('load', [sd])
        //
        // const id = sdmap.get("id") as string;
        //
        // updateSyncedGraph(id, {localDoc: sd})
    })
  })

  // Syncs graphs with remote peers
  const rdoc = new Y.Doc({autoLoad: true})
  rootDoc.getMap().set("rdoc", rdoc)
  const rmap: Y.Map<string> = rdoc.getMap();

  const syncedGraphs = new Map<string, SyncedGraph | Promise<SyncedGraph>>();


  // Observe ymap and call the passed in update. Used for calling change_graph to update nodysseus state
  let undoManager;


  // Add a graph
  const set = (id: string, data: Graph): Promise<Graph> => {
    if(generic_node_ids.has(id)) {
      generic_nodes[id].edges_in = Object.values(generic_nodes[id].edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
      return generic_nodes[id];
    } else if(id && !id.startsWith("_") && Object.keys(data).length > 0) {
      return Promise.resolve(wrapPromise(updateSyncedGraph(id, data)).then(sg => sg.graph).value);
    }
  }


  const add_nodes_edges = (graphId, nodes, edges, remove_edges, remove_nodes) => {
    if(generic_node_ids.has(graphId)) return;

    ymap.get(graphId).transact(() => {
      remove_nodes.forEach(node => (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).delete(typeof node === "string" ? node : node.id));
      remove_edges.forEach(edge => (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(edge.from));
      nodes.forEach(node => (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).set(node.id, node));
      edges.forEach(edge => (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).set(edge.from, edge));
    })

    updateSyncedGraph(graphId)
  }

  const add_node = (graphId, node) => {
    if(generic_node_ids.has(graphId)) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).set(node.id, node)
    })

    updateSyncedGraph(graphId)
  }

  const remove_node = (graphId, node) => {
    if(generic_node_ids.has(graphId)) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
    })

    updateSyncedGraph(graphId)
  }

  const add_edge = (graphId, edge) => {
    if(generic_nodes[graphId]) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).set(edge.from, edge)
    })

    updateSyncedGraph(graphId)
  }

  const remove_edge = (graphId, edge) => {
    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(edge.from)
    })

    updateSyncedGraph(graphId)
  }

  if(persist !== undefined) {
    const indexeddbProvider = new IndexeddbPersistence(`${persist}-subdocs`, ydoc)
    await indexeddbProvider.whenSynced
  }


  const updateSyncedGraph = (id: string, graph?: Graph): {graph: undefined} | SyncedGraph | Promise<SyncedGraph> => 
    wrapPromise(id !== "custom_editor" && id !== "keybindings" && rtcroom)
    .then(rtcroom => wrapPromise(syncedGraphs.get(id)).then(existing => ({existing, rtcroom})).value)
    .then(({existing, rtcroom}) => {
      const syncedGraph: {graph: undefined} | SyncedGraph | Promise<SyncedGraph> = wrapPromise(existing && ymap.has(id) ? existing : Promise.resolve(existing)).then(() => {
        let preloadDoc = ymap.get(id);

        if(!existing && !preloadDoc && !graph && !rmap.has(id)) {
          return {graph: undefined}
        }

        let unloadedRdoc = false;
        // Need to create indexeddbpersistence even if the preloaddoc is generated
        let createdPreload = false;

        // create the preloaddoc before syncing with rtcroom
        if(!preloadDoc) {
          createdPreload = true;
          preloadDoc = new Y.Doc( rmap.has(id) ? {guid: rmap.get(id)} : undefined);
          preloadDoc.getMap().set("id", id)
          if(graph) {
            setMapFromGraph(preloadDoc.getMap(), graph)
          } else {
            unloadedRdoc = true;
          }
          ymap.set(id, preloadDoc);
        }
        
        if(rtcroom && preloadDoc && !rmap.has(id)) {
          rmap.set(id, preloadDoc.guid)
        }

        if(!preloadDoc.isLoaded) {
          preloadDoc.load();
        }


        // see note above createdPreload
        return (!createdPreload && preloadDoc.isLoaded && existing ? wrapPromise({localDoc: preloadDoc, idb: undefined})
            : wrapPromise(existing && !unloadedRdoc ? existing : Promise.resolve(existing))
              .then(() => new IndexeddbPersistence(`${persist}-subdocs-${preloadDoc.guid}`, preloadDoc).whenSynced.then(idb =>{
                if(preloadDoc.getMap().get("nodes") && !createdPreload) {
                  preloadDoc.transact(() => {
                    // Sanitization and transforming from old to new
                    const edgeReplaceMap = new Map<string, Map<string, string>>();
                    let updateEdges = false;
                    const docmap = preloadDoc.getMap();
                    const docnodes: Y.Map<NodysseusNode> = docmap.get("nodes") as Y.Map<NodysseusNode>;
                    (docmap.get("edges") as (Y.Map<Edge> | Y.Map<Y.Map<string>>)).forEach((e: Edge | Y.Map<string>, key: string) => {
                      let edge = e as Edge
                      if(edge.from && edge.to) {
                        updateEdges = true;
                        if(docnodes.has(edge.from) && docnodes.has(edge.to)) {
                          if(!edgeReplaceMap.has(edge.to)) {
                            edgeReplaceMap.set(edge.to, new Map())
                          }

                          edgeReplaceMap.get(edge.to).set(edge.as, edge.from)
                        } else if(!docnodes.has(edge.from)) {
                          docnodes.set(edge.from, {id: edge.from})
                        } else if(!docnodes.has(edge.to)) {
                          docnodes.set(edge.to, {id: edge.to})
                        }
                      } else if(edge.from || edge.to) {
                        // remove_edge(id, edge);
                      } else {
                        (e as Y.Map<string>).forEach((as, from) => {
                          if(!(docnodes.has(key) && docnodes.has(from))) {
                            throw new Error(`invalid edge ${from} to ${key} as ${as}`)
                          }
                        })
                      }
                    })


                    if(updateEdges) {
                      // console.log("would update", edgeReplaceMap)
                    }
                  })
                }

                // Hook undoManager invisibly to persistence
                const undoManager = new Y.UndoManager(preloadDoc.getMap());
                getLocalGraphYMap(id).observeDeep(events => events.forEach(event => {
                  if(event.transaction.local === false || event.transaction.origin === undoManager) {
                    update(event as Y.YMapEvent<YMap<Y.Doc>>, id)
                    updateSyncedGraph(id)
                  }
                }))

                return {localDoc: preloadDoc, idb}
              })))

              .then(({localDoc, idb}) => {
                if(graph) {
                    graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})

                    if(!(existing?.graph && compareObjects(graph, existing.graph))) {
                      syncedGraphs.set(id, {...existing, graph})
                      nolib.no.runtime.publish('graphchange', graph, {...nolib, ...hlib}) 
                    }

                    return syncedGraphs.get(id);
                } else {
                  const graph = localDoc.getMap().toJSON() as Graph;
                  if(graph.nodes) {
                    graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
                    nolib.no.runtime.publish('graphchange', graph, {...nolib, ...hlib}) 
                  }
                  const updatedExisting = syncedGraphs.get(id);
                  return {
                    graph,
                    idb: idb ?? existing?.idb,
                    remoteProvider: rtcroom && (existing?.remoteProvider ?? (updatedExisting as SyncedGraph)?.remoteProvider ?? new WebrtcProvider(`nodysseus${rtcroom}_${localDoc.guid}`, localDoc, {
                      signaling: ["wss://ws.nodysseus.io"], 
                      filterBcConns: true,
                      password: undefined,
                      awareness: undefined,
                      maxConns: undefined,
                      peerOpts: {
                        config: {
                          iceServers: [
                            {urls: "stun:ws.nodysseus.io:3478"}
                          ]
                        }
                      }
                    }))
                  }
                }
              }).then(sg => {
                syncedGraphs.set(id, sg)
                return sg;
              }).value
        }).value;

        if(ispromise(syncedGraph) || syncedGraph.graph) {
          syncedGraphs.set(id, syncedGraph as SyncedGraph)
        }

        return syncedGraph
    }).value;

  // grab rtcroom after the initial load of indexeddb
  let rtcroom = wrapPromise(updateSyncedGraph("custom_editor"))
    .then(sg => sg.graph)
    .then(custom_editor => !!custom_editor && hlib.run(custom_editor, custom_editor.out ?? "out"))
    .then(custom_editor_result => {
      rtcroom = custom_editor_result?.rtcroom || false;

      if(rtcroom) {
        new WebrtcProvider(`nodysseus${rtcroom}_subdocs`, rdoc, {
          signaling: ["wss://ws.nodysseus.io"],
          password: undefined,
          awareness: undefined,
          filterBcConns: true,
          maxConns: undefined,
          peerOpts: {
            config: {
              iceServers: [
                {urls: "stun:ws.nodysseus.io:3478"}
              ]
            }
          }
        })

        rdoc.getMap().observe(evts => {
          evts.keysChanged.forEach(k => {
            requestAnimationFrame(() => updateSyncedGraph(k))
          })
        })
      }

      return rtcroom;
    }).value

  if(update !== undefined) {
    ymap.observeDeep(events =>{
      events.forEach((event: Y.YMapEvent<typeof ymap>) => {
        if(!event.transaction.local || event.transaction.origin === undoManager) {
          update(event)
        }

        for(let k of event.keysChanged) {
          // Don't readd deleted things
          if(event.target.get(k)) {
            updateSyncedGraph(k);
          }
        }
      })
    })
  }

  const get = (id) => {
    if(generic_node_ids.has(id)) {
      return generic_nodes[id];
    }

    return wrapPromise(syncedGraphs.get(id))
      .then(syncedGraph => syncedGraph ?? updateSyncedGraph(id))
      .then(syncedGraph => syncedGraph?.graph).value;

    // TODO: if rdoc has it and it's not synced, what then?
  }

  return {
    get,
    set,
    add_node,
    remove_node,
    add_nodes_edges,
    add_edge,
    remove_edge,
    delete: id => {
      console.log(`removing ${id}`)
      return wrapPromise(syncedGraphs.get(id))
        .then(syncedGraph => {
          syncedGraph?.idb?.clearData();
          syncedGraphs.delete(id);
          ymap.get(id)?.destroy();
          ymap.delete(id);
          rmap.delete(id);
        }).value
    },
    clear: () => {
      throw new Error("Can't remove all refs")
    },
    keys: () => {
      const keys = [...ymap.keys(), ...Object.keys(generic_nodes)];
      return keys//.map(v => get(v))
    },
    undo: persist && (() => undoManager.undo()),
    redo: persist && (() => undoManager.redo()),
  }
}

export const yNodyStore = async (useRtc: boolean = false): Promise<NodysseusStore> => {
  const statedb = mapStore<{id: string, data: Record<string, any>}>();

  let nodysseusidb;

  await openDB("nodysseus", 2, {
    upgrade(db) {
      db.createObjectStore("assets")
    }
  }).then(db => { nodysseusidb = db })

  return {
    refs: await ydocStore({
      persist: 'refs', 
      useRtc, 
      update: (event, id) => {
        // console.log(`update event`)
        // console.log(event);
        if(!id && event.keysChanged.size > 1) {
          return;
        }

        const updatedgraph = id ?? (event.currentTarget as YMap<any>).get("id");
        if(updatedgraph !== undefined) {
          requestAnimationFrame(() =>  {
            // console.log(updatedgraph);
            // console.log(nolib.no.runtime.get_ref(updatedgraph))
            nolib.no.runtime.change_graph(nolib.no.runtime.get_ref(updatedgraph), {...nolib, ...hlib}, event.transaction.local)
          }) 
        }
      }
    }),
    parents: mapStore(),
    state: mapStore(),
    fns: mapStore(),
    assets: {
      get: (id) => nodysseusidb.get('assets', id),
      set: (id, blob) => nodysseusidb.put('assets', blob, id),
      delete: id => nodysseusidb.delete('assets', id),
      clear: () => nodysseusidb.clear('assets'),
      keys: () => nodysseusidb.getAllKeys('assets')
    }
  }
}
