import { IDBPDatabase, openDB, wrap } from "idb";
import custom_editor from "../custom_editor.json"
// import { IndexeddbPersistence } from "y-indexeddb";
// import * as Y from "yjs"
import generic from "../generic";
import { compare, mapStore, nolib } from "../nodysseus";
import { Edge, EdgesIn, Graph, GraphNode, isNodeRef, NodysseusNode, NodysseusStore, RefNode, RefStore, Store, ValueNode } from "../types";
import { ancestor_graph, compareObjects, ispromise, mapMaybePromise, wrapPromise } from "../util";
import { hlib, EXAMPLES } from "./util";
import * as Automerge from "@automerge/automerge";
import {v4 as uuid, parse as uuidparse, stringify as uuidstringify} from "uuid";
import { PatchCallback } from "@automerge/automerge";

import categoryChanges from "../../public/categoryChanges.json"
import { initgraph } from "./initgraph";
import { createDo } from "typescript";

const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

const migrateCategories = (doc: Automerge.Doc<Graph>) => {
  if(!doc.nodes) return;

  Object.entries(doc.nodes).forEach(([k, n]) => {
    if(isNodeRef(doc.nodes[k]) && categoryChanges[(doc.nodes[k] as RefNode).ref] ) {
      const ref = (doc.nodes[k] as RefNode).ref;
      (doc.nodes[k] as RefNode).ref =  `@${categoryChanges[ref]}.${ref}`;
    }
  })
}


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
  const syncedSet = new Set<string>()


  /////
  // Fns
  //
  
  const createDoc = () => Automerge.applyChanges(Automerge.init<Graph>(), [initgraph])[0];

  const updatePeers = (id: string, peerId?: string) => {
    if(id === "custom_editor") return;

    syncedSet.add(id);

    if(updatePeersDebounces[id]) cancelAnimationFrame(updatePeersDebounces[id])
    updatePeersDebounces[id] = requestAnimationFrame(() => {
      wrapPromise(refsmap.get(id)).then(current => {
        updatePeersDebounces[id] = false;
        (peerId ? [[peerId, syncStates[peerId]]] : Object.entries(syncStates)).forEach(([peer, syncState]) => {
          const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
            current,
            syncState[id] || Automerge.initSyncState()
          )
          syncStates[peer] = {...syncStates[peer], [id]: nextSyncState};
          if(syncMessage) {
            if(syncStates[peer]._syncType === "broadcast") {
              syncBroadcast.postMessage({type: "syncgraph", id, peerId, target: peer, syncMessage});
            } else if(syncStates[peer]._syncType === "ws") {
              syncWS.send(new Blob([Uint8Array.of(syncMessageTypesRev["syncgraph"]), uuidparse(peerId), uuidparse(peer), id.padEnd(64, " "), syncMessage]))
            }
          }
        })
      })
    })
  }

  const graphNodePatchCallback: PatchCallback<Graph> = (patches, before, after) => {
    const changedNodes = new Set()
    patches.forEach(patch => patch.path[0] === "nodes" && changedNodes.add(patch.path[1]));

    if(changedNodes.size > 0) {
      requestAnimationFrame(() => {
        nolib.no.runtime.change_graph(refs.get(after.id), {...nolib, ...hlib}, [...changedNodes]); 
      })
    }
  }

  // Gets the actual automerge doc - for this store only
  // For any outside interaction, do a structured clone.
  const getDoc = (id: string): Automerge.Doc<Graph> | Promise<Automerge.Doc<Graph>> =>
    refsmap.has(id) ? refsmap.get(id) 
      : refsset.has(id) 
      ? nodysseusidb.get("refs", id)
        .then(persisted => {
            let doc = Automerge.load<Graph>(persisted)
            doc = Automerge.change(doc, migrateCategories);
            refsmap.set(id, doc);
            let scd = structuredClone(doc);
            structuredCloneMap.set(id, scd);
            // return doc;
            // TODO: validate graphs on load - this doesn't work because the automerge docs change.
            const filteredGraph = ancestor_graph(doc.out, doc, nolib);
            if(!(filteredGraph.nodes.length === scd.nodes.length && Object.keys(filteredGraph.edges).length === Object.keys(scd.edges).length)) {
              doc = Automerge.change(doc, {patchCallback: graphNodePatchCallback}, setFromGraph(filteredGraph));
              persist && nodysseusidb.put("refs", Automerge.save(doc), id)
              refsmap.set(id, doc);
              scd = structuredClone(doc)
              structuredCloneMap.set(id, scd);
            }
            updatePeers(id);
            return refsmap.get(id);
        })
      : undefined

  const changeDoc = (id, fn, changedNodes = []): Graph | Promise<Graph> => {
    if(generic_node_ids.has(id)) {
      nolib.no.runtime.publish("grapherror", new Error("Cannot edit default nodes"))
      return;
    }
    return wrapPromise(getDoc(id))
      .then(graph => {
        let doc = Automerge.change<Graph>(graph ?? createDoc(), {patchCallback: graphNodePatchCallback}, fn);
        if(!doc.edges_in) {
          doc = Automerge.change<Graph>(doc, {patchCallback: graphNodePatchCallback}, d => {
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
        // nolib.no.runtime.publish('graphchange', {graph: scd}, {...nolib, ...hlib}) 
        // nolib.no.runtime.change_graph(scd, {...nolib, ...hlib}, changedNodes) 
        return scd;
      }).value
  }

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

  const setFromGraph = (graph: Graph) => (doc: Graph) =>  {
    Object.entries(doc).forEach(e => !Object.hasOwn(graph, e[0]) && delete doc[e[0]])
    Object.entries(structuredClone(graph)).forEach(e => {
      if(graph[e[0]] === undefined) {
        delete doc[e[0]]
      } else if(e[1] !== undefined){
        if(e[0] === "nodes" && Array.isArray(e[1])) {
          doc[e[0]] = Object.fromEntries(e[1].map(n => [n.id, n]))
        } else if(e[0] === "edges" && Array.isArray(e[1])) {
          doc[e[0]] = Object.fromEntries(e[1].map(e => [e.from, e]))
        } else {
          doc[e[0]] = e[1]
        }
      }
    })
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
      set: (id, graph) => changeDoc(id, setFromGraph(graph)),
      delete: (id) => {
        refsmap.delete(id);
        refsset.delete(id);
        structuredCloneMap.delete(id);
        return nodysseusidb.delete("refs", id);
      },
      clear: () => {throw new Error("not implemented")},
      keys: () => {return [...refsset.keys(), ...generic_node_ids]},
      undo: () => {throw new Error("not implemented")},
      redo: () => {throw new Error("not implemented")},
      add_node: (id, node) => changeDoc(id, doc => {
        // TODO: try to fix by making the values texts instead of just strings
        if(doc.nodes[node.id]) {
          Object.keys(node).concat(Object.keys(doc.nodes[node.id]))
            .forEach(k => { 
              if(doc.nodes[node.id][k] !== node[k]) {
                if(node[k] === undefined) {
                  delete doc.nodes[node.id][k]
                } else {
                  doc.nodes[node.id][k] = node[k];
                }
              }
            })
        } else {
          Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]])
          doc.nodes[node.id] = node;
        }
      }, [node.id]),
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

      }, nodes.map(n => n.id)),
      remove_node: (id, node) => changeDoc(id, removeNodeFn(node), [node.id]),
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
      !data.target && syncBroadcast.postMessage({type: "syncstart", peerId, target: data.peerId})
      for(const graphId of syncedSet.values()) {
        updatePeers(graphId, data.peerId);
      }
    } else if (data.type === "syncgraph" && data.target === peerId) {
      wrapPromise(getDoc(data.id)).then(currentDoc => {
        const id = data.id;
        currentDoc = currentDoc ?? createDoc();
        const [nextDoc, nextSyncState, patch] = Automerge.receiveSyncMessage<Graph>(
          currentDoc, 
          syncStates[data.peerId]?.[id] || Automerge.initSyncState(), 
          data.syncMessage, {
          patchCallback: graphNodePatchCallback
        });
        persist && nodysseusidb.put("refs", Automerge.save(nextDoc), id)
        refsset.add(id);
        refsmap.set(id, nextDoc);
        structuredCloneMap.set(id, structuredClone(nextDoc));
        syncStates[data.peerId] = {...syncStates[data.peerId], [id]: nextSyncState};

        updatePeers(id);
      })
    }
  })

  let syncWS;

  // Wrap run in requestAnimationFrame so nodysseus has time to init
  requestAnimationFrame(() => {
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
            target: uintbuffer.length > 18 && uuidstringify(uintbuffer.subarray(17, 33)),
            id: new TextDecoder().decode(uintbuffer.subarray(33, 97)).trimEnd(),
            syncMessage: messageType === "syncgraph" && uintbuffer.subarray(97),
          };
          if(data.type === "syncstart" && !syncStates[data.peerId] && data.peerId !== peerId) {
            syncStates[data.peerId] = {_syncType: "ws"};
            !data.target && syncWS.send(new Blob([Uint8Array.of(syncMessageTypesRev["syncstart"]), uuidparse(peerId), uuidparse(data.peerId)]))
            for(const graphId of syncedSet.values()) {
              updatePeers(graphId, data.peerId);
            }
          } else if (data.type === "syncgraph" && data.target === peerId) {
            const id = data.id;
            wrapPromise(getDoc(id)).then(current => {
              data.syncMessage = Uint8Array.from(Object.values(data.syncMessage))
              current = current ?? createDoc();
              const [nextDoc, nextSyncState, patch] = Automerge.receiveSyncMessage(
                current, 
                syncStates[data.peerId]?.[id] || Automerge.initSyncState(), 
                data.syncMessage, {
                patchCallback: graphNodePatchCallback
              });
              persist && nodysseusidb.put("refs", Automerge.save(nextDoc), id)
              refsset.add(id);
              refsmap.set(id, nextDoc);
              structuredCloneMap.set(id, structuredClone(nextDoc));
              syncStates[data.peerId] = {...syncStates[data.peerId], [id]: nextSyncState};

              updatePeers(id);
            })
          }
        })
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


