import * as Automerge from "@automerge/automerge";
import { PatchCallback } from "@automerge/automerge";
import { IDBPDatabase } from "idb";
import { Graph, isNodeGraph, isNodeRef, isNodeValue, NodysseusNode, NodysseusStoreTypes, RefNode, RefStore } from "src/types";
import { ancestor_graph, wrapPromise } from "src/util";
import categoryChanges from "../../public/categoryChanges.json"
import { initgraph } from "./initgraph";
import generic from "../generic";
import { compare, nolib, nolibLib } from "src/nodysseus";
import { hlibLib } from "./util";
import {addNode, addNodesEdges, removeNode, removeEdge, addEdge} from "./store";
import {v4 as uuid, parse as uuidparse, stringify as uuidstringify} from "uuid";
import { SharedWorkerMessageFrom, SharedWorkerMessageTo } from "./types";
import custom_editor from "../custom_editor.json"

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

export const automergeRefStore = async ({nodysseusidb, persist = false} : {persist: boolean, nodysseusidb: IDBPDatabase<NodysseusStoreTypes>}): Promise<RefStore> => {

  const refsmap = new Map<string, Automerge.Doc<Graph>>();
  const structuredCloneMap = new Map<string, Graph>();
  const refsset = new Set(await nodysseusidb.getAllKeys("refs").then(ks => ks.map(k => k.toString())));
  const syncedSet = new Set<string>()

  /////
  // Fns
  //
  
  const createDoc = () => Automerge.applyChanges(Automerge.init<Graph>(), [initgraph])[0];

  const updatePeers = (id: string, target?: string) => {
    if(id === "custom_editor") return;

    syncedSet.add(id);

    if(updatePeersDebounces[id]) clearTimeout(updatePeersDebounces[id])
    updatePeersDebounces[id] = setTimeout(() => {
      wrapPromise(refsmap.get(id)).then(current => {
        updatePeersDebounces[id] = false;
        (target ? [[target, syncStates[target]]] : Object.entries(syncStates)).forEach(([peer, syncState]) => {
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
    }, 100)
  }

  const graphNodePatchCallback: PatchCallback<Graph> = (patches, before, after) => {
    const changedNodes = new Set<string>()
    patches.forEach(patch => patch.path[0] === "nodes" && changedNodes.add(patch.path[1] as string));

    if(changedNodes.size > 0) {
      setTimeout(() => {
        wrapPromise(refs.get(after.id))
        .then(after => nolib.no.runtime.change_graph(after, hlibLib, [...changedNodes])); 
      }, 16)
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
            const filteredGraph = ancestor_graph(doc.out, doc);
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
      nolib.no.runtime.publish("grapherror", new Error("Cannot edit default nodes"), nolibLib)
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
        // nolib.no.runtime.change_graph(scd, hlibLib, changedNodes, true, "automergeStore") 
        return scd;
      }).value
  }

  const nodeCompare = (a: NodysseusNode, b: NodysseusNode) =>
    a.id === b.id && a.name === b.name &&
      (!isNodeValue(a) || (isNodeValue(b) && b.value === a.value))
      && (!isNodeRef(a) || (isNodeRef(b) && b.ref === a.ref))
      && (!isNodeGraph(a) || (isNodeGraph(b) && graphCompare(a, b)))

  const graphCompare = (a: Graph, b: Graph) => 
    a.id === b.id
    && Object.keys(a.nodes).length === Object.keys(b.nodes).length
    && Object.entries(a.edges).every(e => b.edges[e[0]].as === e[1].as && b.edges[e[0]].to === e[1].to)
    && Object.values(a.nodes).every(n => nodeCompare(n, b.nodes[n.id]))
    && a.description === b.description

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
    addFromUrl: url => fetch(url)
      .then(res => res.json())
      .then(refsToAdd => Promise.all(refsToAdd.map((ref: Graph) => refs.set(ref.id, ref))).then(gs => gs)),
    get: (id) => generic_nodes[id] ?? (structuredCloneMap.has(id) 
        ? structuredCloneMap.get(id) 
        : wrapPromise(getDoc(id))
          .then(d => {
            const scd = structuredClone(d);
            structuredCloneMap.set(id, scd);
            return scd;
          }).value)
    ,
    set: (id, graph) => 
      wrapPromise(refs.get(id))
        .then(current => current && graphCompare(current, graph) ? (console.log("skipping", id), current): changeDoc(id, setFromGraph(graph)) ).value,
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
      addNode(doc, node)
    }, [node.id]),
    add_nodes_edges: ({graphId, addedNodes, addedEdges, removedEdges, removedNodes}) =>
      changeDoc(graphId, graph => {
        addNodesEdges(graph, addedNodes, addedEdges, removedNodes, removedEdges)
      }),
    remove_node: (id, node) => changeDoc(id, removeNode(node), [node.id]),
    add_edge: (id, edge) => changeDoc(id, g => addEdge(g, edge)),
    remove_edge: (id, edge) => changeDoc(id, removeEdge(edge))
  }

  /////
  // Stateful


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

  // Wrap run in setTimeout so nodysseus has time to init
  setTimeout(() => {
    wrapPromise(getDoc("custom_editor"))
      .then(ce => {
        if(!ce){
          refs.set("custom_editor", custom_editor)
          ce = custom_editor;
        }
        return nolib.no.runtime.run({graph: ce.id, fn: ce.out ?? "out"})
      })
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
  }, 100)

  let updatePeersDebounces = {};

  return refs;
}
