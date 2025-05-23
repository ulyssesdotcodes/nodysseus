import * as Automerge from "@automerge/automerge";
import {
  decodeSyncState,
  encodeSyncState,
  PatchCallback,
} from "@automerge/automerge";
import { IDBPDatabase } from "idb";
import {
  Graph,
  isNodeGraph,
  isNodeRef,
  isNodeValue,
  NodysseusNode,
  NodysseusStoreTypes,
  RefStore,
} from "src/types.js";
import { ancestor_graph, wrapPromise } from "src/util.js";
import { initgraph } from "./initgraph.js";
import generic from "../generic.js";
import { compare, nolib, nolibLib } from "src/nodysseus.js";
import { hlibLib } from "./util.js";
import {
  addNode,
  addNodesEdges,
  removeNode,
  removeEdge,
  addEdge,
} from "./store.js";
import {
  v4 as uuid,
  parse as uuidparse,
  stringify as uuidstringify,
} from "uuid";
import custom_editor from "../custom_editor.json" with { type: "json" };
// import { NodysseusRuntime } from "src/dependency-tree/dependency-tree.js";

const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

// hacky global
let syncWS: WebSocket;

export const automergeRefStore = async ({
  nodysseusidb,
  persist = false,
  graphChangeCallback,
  run,
  fallbackRefStore,
}: {
  persist: boolean;
  nodysseusidb: IDBPDatabase<NodysseusStoreTypes>;
  graphChangeCallback?: (graph: Graph, changedNodes: Array<string>) => void;
  run: (graph: Graph, id: string) => unknown | Promise<unknown>;
  fallbackRefStore?: RefStore;
}): Promise<RefStore> => {
  const undoHistory = new Map<string, Array<Automerge.Doc<Graph>>>();
  const redoHistory = new Map<string, Array<Automerge.Doc<Graph>>>();

  const refsmap = new Map<string, Automerge.Doc<Graph>>();
  const structuredCloneMap = new Map<string, Graph>();
  const refsset = new Set(
    await nodysseusidb
      .getAllKeys("refs")
      .then((ks) => ks.map((k) => k.toString()).filter((k) => k))
  );
  const syncedSet = new Set<string>();

  /////
  // Fns
  //

  const createDoc = () =>
    Automerge.applyChanges(Automerge.init<Graph>(), [initgraph])[0];

  const updatePeers = async (id: string, target?: string) => {
    if (id === "custom_editor") return;

    syncedSet.add(id);

    if (target && !syncStates[target]?.[id]) {
      if (!syncStates[target]) {
        syncStates[target] = { _syncType: "ws" };
      }

      const syncState = await nodysseusidb.get("sync", `${target}-${id}`);
      if (syncState) {
        syncStates;
        syncStates[target][id] = decodeSyncState(syncState);
      }
    }

    if (updatePeersDebounces[id]) clearTimeout(updatePeersDebounces[id]);
    updatePeersDebounces[id] = setTimeout(() => {
      wrapPromise(refsmap.get(id)).then((current) => {
        updatePeersDebounces[id] = false;
        (target
          ? [[target, syncStates[target]]]
          : Object.entries(syncStates)
        ).forEach(([peer, syncState]) => {
          const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
            current,
            syncState[id] || Automerge.initSyncState()
          );
          syncStates[peer] = { ...syncStates[peer], [id]: nextSyncState };
          if (syncMessage) {
            if (syncStates[peer]._syncType === "broadcast") {
              syncBroadcast.postMessage({
                type: "syncgraph",
                id,
                peerId,
                target: peer,
                syncMessage,
              });
            } else if (syncStates[peer]._syncType === "ws") {
              syncWS.send(
                new Blob([
                  Uint8Array.of(syncMessageTypesRev["syncgraph"]),
                  uuidparse(peerId),
                  uuidparse(peer),
                  id.padEnd(64, " "),
                  syncMessage,
                ])
              );
            }
          }
        });
      });
    }, 100);
  };

  const graphNodePatchCallback: (
    addToHistory: boolean
  ) => PatchCallback<Graph> = (addToHistory: boolean) => (patches, props) => {
    if (!addToHistory) return;

    if (!undoHistory.has(props.before.id)) {
      undoHistory.set(props.before.id, []);
    }

    redoHistory.set(props.before.id, []);

    const changedNodes = new Set<string>();
    patches.forEach(
      (patch) =>
        patch.path[0] === "nodes" && changedNodes.add(patch.path[1] as string)
    );

    if (changedNodes.size > 0) {
      undoHistory.get(props.before.id).push(props.before);
      setTimeout(() => {
        wrapPromise(refs.get(props.after.id)).then((after) =>
          nolib.no.runtime.change_graph(after, hlibLib, [...changedNodes])
        );
      }, 16);
    }
  };

  // Gets the actual automerge doc - for this store only
  // For any outside interaction, do a structured clone.
  const getDoc = (
    id: string
  ): Automerge.Doc<Graph> | Promise<Automerge.Doc<Graph>> =>
    refsmap.has(id)
      ? refsmap.get(id)
      : refsset.has(id)
      ? nodysseusidb.get("refs", id).then((persisted) => {
          let doc = Automerge.load<Graph>(persisted);
          refsmap.set(id, doc);

          const filteredGraph = ancestor_graph(doc.out, doc);
          if (!graphCompare(doc, filteredGraph)) {
            doc = Automerge.change(
              doc,
              { patchCallback: graphNodePatchCallback(true) },
              setFromGraph(filteredGraph)
            );
            persist && nodysseusidb.put("refs", Automerge.save(doc), id);
            refsmap.set(id, doc);
          }

          const scd = structuredClone(filteredGraph);
          structuredCloneMap.set(id, scd);
          updatePeers(id);
          return refsmap.get(id);
        })
      : undefined;

  const changeDoc = (
    id,
    fn,
    _changedNodes = [],
    addToHistory = true
  ): Graph | Promise<Graph> => {
    if (generic_node_ids.has(id)) {
      nolib.no.runtime.publish(
        "grapherror",
        new Error("Cannot edit default nodes"),
        nolibLib
      );
      return;
    }
    if (id === undefined) {
      return;
    }
    return wrapPromise(getDoc(id)).then((graph) => {
      const doc = Automerge.change<Graph>(
        graph ?? createDoc(),
        { patchCallback: graphNodePatchCallback(addToHistory) },
        fn
      );
      persist && nodysseusidb.put("refs", Automerge.save(doc), id);
      refsmap.set(id, doc);
      refsset.add(id);
      updatePeers(id);
      const scd: Graph = structuredClone(doc);
      scd.edges_in = {};
      Object.values(scd.edges).forEach((edge) => {
        if (scd.edges_in[edge.to]) {
          scd.edges_in[edge.to][edge.from] = { ...edge };
        } else {
          scd.edges_in[edge.to] = { [edge.from]: { ...edge } };
        }
      });
      structuredCloneMap.set(id, scd);
      // nolib.no.runtime.publish('graphchange', {graph: scd}, {...nolib, ...hlib})
      // nolib.no.runtime.change_graph(scd, hlibLib, changedNodes, true, "automergeStore")
      graphChangeCallback && graphChangeCallback(scd, []);
      return scd;
    }).value;
  };

  const nodeCompare = (a: NodysseusNode, b: NodysseusNode) =>
    a.id === b.id &&
    a.name === b.name &&
    (!isNodeValue(a) || (isNodeValue(b) && b.value === a.value)) &&
    (!isNodeRef(a) || (isNodeRef(b) && b.ref === a.ref)) &&
    (!isNodeGraph(a) || (isNodeGraph(b) && graphCompare(a, b)));

  const graphCompare = (a: Graph, b: Graph) =>
    a.id === b.id &&
    Object.keys(a.nodes).length === Object.keys(b.nodes).length &&
    Object.entries(a.edges).every(
      (e) => b.edges[e[0]]?.as === e[1].as && b.edges[e[0]]?.to === e[1].to
    ) &&
    Object.values(a.nodes).every((n) => nodeCompare(n, b.nodes[n.id])) &&
    a.description === b.description;

  const setFromGraph = (graph: Graph) => (doc: Graph) => {
    delete doc.edges_in;
    Object.entries(doc).forEach(
      (e) => !Object.hasOwn(graph, e[0]) && delete doc[e[0]]
    );
    Object.entries(structuredClone(graph)).forEach((e) => {
      if (e[0] === "edges_in") {
        //noop
      } else if (graph[e[0]] === undefined) {
        delete doc[e[0]];
      } else if (e[1] !== undefined) {
        if (e[0] === "nodes" && Array.isArray(e[1])) {
          doc[e[0]] = Object.fromEntries(e[1].map((n) => [n.id, n]));
        } else if (e[0] === "edges" && Array.isArray(e[1])) {
          doc[e[0]] = Object.fromEntries(e[1].map((e) => [e.from, e]));
        } else {
          doc[e[0]] = e[1];
        }
      }
    });
  };

  const fallbackKeys = (await fallbackRefStore?.keys()) ?? [];

  const refs: RefStore = {
    addFromUrl: (url) =>
      fetch(url)
        .then((res) => res.json())
        .then((refsToAdd) =>
          Promise.all(
            refsToAdd.map((ref: Graph) => refs.set(ref.id, ref))
          ).then((gs) => gs)
        ),
    get: (id) =>
      generic_nodes[id] ??
      (structuredCloneMap.has(id)
        ? structuredCloneMap.get(id)
        : wrapPromise(getDoc(id))
            .then(() => {
              return structuredCloneMap.get(id);
            })
            .then((graph) =>
              graph || !fallbackKeys.includes(id)
                ? graph
                : wrapPromise(fallbackRefStore.get(id)).then((fallbackGraph) =>
                    changeDoc(fallbackGraph.id, setFromGraph(fallbackGraph))
                  ).value
            ).value),
    set: (id, graph) =>
      wrapPromise(refs.get(id)).then((current) =>
        current && graphCompare(current, graph)
          ? (console.info("skipping", id), current)
          : changeDoc(id, setFromGraph(graph))
      ).value,
    delete: (id) => {
      refsmap.delete(id);
      refsset.delete(id);
      structuredCloneMap.delete(id);
      return nodysseusidb.delete("refs", id);
    },
    clear: () => {
      throw new Error("not implemented");
    },
    keys: () => {
      return [...refsset.keys(), ...generic_node_ids, ...fallbackKeys];
    },
    undo: (id: string) => {
      if (undoHistory.has(id) && undoHistory.get(id).length > 0) {
        const current = structuredCloneMap.get(id);
        const graph = undoHistory.get(id).pop();
        redoHistory.get(id).push(current);
        return changeDoc(id, setFromGraph(graph), [], false);
      }
    },
    redo: (id: string) => {
      if (redoHistory.has(id) && redoHistory.get(id).length > 0) {
        const current = structuredCloneMap.get(id);
        const graph = redoHistory.get(id).pop();
        undoHistory.get(id).push(current);
        return changeDoc(id, setFromGraph(graph), [], false);
      }
    },
    add_node: (id, node) =>
      changeDoc(
        id,
        (doc) => {
          // TODO: try to fix by making the values texts instead of just strings
          addNode(doc, node);
        },
        [node.id]
      ),
    add_nodes_edges: ({
      graphId,
      addedNodes,
      addedEdges,
      removedEdges,
      removedNodes,
    }) =>
      changeDoc(graphId, (graph) => {
        addNodesEdges(
          graph,
          addedNodes,
          addedEdges,
          removedNodes,
          removedEdges
        );
      }),
    remove_node: (id, node) => changeDoc(id, removeNode(node), [node.id]),
    add_edge: (id, edge) => changeDoc(id, (g) => addEdge(g, edge)),
    remove_edge: (id, edge) => changeDoc(id, removeEdge(edge)),
  };

  /////
  // Stateful

  const syncMessageTypes = {
    0: "syncstart",
    1: "syncgraph",
    2: "argsupdate",
  };
  const syncMessageTypesRev = {
    syncstart: 0,
    syncgraph: 1,
    argsupdate: 2,
  };

  const syncBroadcast = new BroadcastChannel("refssync");
  const syncStates = {};

  const sentStates = new Map<string, unknown>();

  let peerId = await nodysseusidb.get("sync", "peerId");
  if (!peerId) {
    peerId = uuid();
    nodysseusidb.put("sync", peerId, "peerId");
  }

  syncBroadcast.postMessage({ type: "syncstart", peerId });

  syncBroadcast.addEventListener("message", (v) => {
    const data = v.data;
    if (
      data.type === "syncstart" &&
      syncStates[data.peerId]?._syncType !== "broadcast" &&
      data.peerId !== peerId
    ) {
      syncStates[data.peerId] = { _syncType: "broadcast" };
      !data.target &&
        syncBroadcast.postMessage({
          type: "syncstart",
          peerId,
          target: data.peerId,
        });
      for (const graphId of syncedSet.values()) {
        updatePeers(graphId, data.peerId);
      }
    } else if (data.type === "syncgraph" && data.target === peerId) {
      wrapPromise(getDoc(data.id)).then((currentDoc) => {
        const id = data.id;
        currentDoc = currentDoc ?? createDoc();
        const [nextDoc, nextSyncState, _patch] =
          Automerge.receiveSyncMessage<Graph>(
            currentDoc,
            syncStates[data.peerId]?.[id] || Automerge.initSyncState(),
            data.syncMessage,
            {
              patchCallback: graphNodePatchCallback(true),
            }
          );
        persist && nodysseusidb.put("refs", Automerge.save(nextDoc), id);
        refsset.add(id);
        refsmap.set(id, nextDoc);
        structuredCloneMap.set(id, structuredClone(nextDoc));
        syncStates[data.peerId] = {
          ...syncStates[data.peerId],
          [id]: nextSyncState,
        };

        updatePeers(id);
      });
    }
  });

  // Wrap run in setTimeout so nodysseus has time to init
  setTimeout(() => {
    const urlParams = new URLSearchParams(location.search);
    (urlParams.has("room")
      ? wrapPromise(urlParams.get("room"))
      : wrapPromise(getDoc("custom_editor"))
          .then((ce) => {
            if (!ce) {
              refs.set("custom_editor", custom_editor);
              ce = custom_editor;
            }

            // TODO: remove circular dependency
            return run(ce, ce.out ?? "out");
          })
          .then((cer) => (cer as { room: string }).room)
    ).then((rtcroom) => {
      if (!rtcroom) return;

      console.info("Using rtcroom: ", rtcroom);

      if (!syncWS) {
        syncWS = new WebSocket(`wss://ws.nodysseus.io/${rtcroom}`);
        nolib.no.runtime.addListener(
          "argsupdate",
          "__websocket",
          ({ id, changes, mutate, source }, _lib) => {
            if (source.type === "ws") return;
            if (mutate) return;
            const current =
              sentStates.get(id) ??
              (sentStates.set(id, {}), sentStates.get(id));
            Object.entries(changes).forEach((kv) => {
              if (
                kv[1] !== undefined &&
                !compare(current[kv[0]], kv[1]) &&
                source.id !== peerId
              ) {
                source !== "ws" &&
                  syncWS.send(
                    new Blob([
                      Uint8Array.of(syncMessageTypesRev["argsupdate"]),
                      JSON.stringify({
                        id,
                        changes,
                        source: { id: peerId, type: "ws" },
                      }),
                    ])
                  );
                current[kv[0]] = kv[1];
              }
            });
          }
        );
      }

      syncWS.addEventListener("open", () => {
        syncWS.send(
          new Blob([
            Uint8Array.of(syncMessageTypesRev["syncstart"]),
            uuidparse(peerId),
          ])
        );
      });

      syncWS.addEventListener("message", (ev: MessageEvent) => {
        ev.data.arrayBuffer().then((evbuffer) => {
          const uintbuffer = new Uint8Array(evbuffer);
          const messageType = syncMessageTypes[uintbuffer[0]];
          if (messageType === "syncstart" || messageType === "syncgraph") {
            const data = {
              type: messageType,
              peerId: uuidstringify(uintbuffer.subarray(1, 17)),
              target:
                uintbuffer.length > 18 &&
                uuidstringify(uintbuffer.subarray(17, 33)),
              id: new TextDecoder()
                .decode(uintbuffer.subarray(33, 97))
                .trimEnd(),
              syncMessage:
                messageType === "syncgraph" && uintbuffer.subarray(97),
            };
            if (data.type === "syncstart" && data.peerId !== peerId) {
              if (!syncStates[data.peerId]) {
                syncStates[data.peerId] = { _syncType: "ws" };
              }
              !data.target &&
                syncWS.send(
                  new Blob([
                    Uint8Array.of(syncMessageTypesRev["syncstart"]),
                    uuidparse(peerId),
                    uuidparse(data.peerId),
                  ])
                );
              for (const graphId of syncedSet.values()) {
                updatePeers(graphId, data.peerId);
              }
            } else if (data.type === "syncgraph" && data.target === peerId) {
              const id = data.id;
              wrapPromise(getDoc(id)).then((current) => {
                data.syncMessage = Uint8Array.from(
                  Object.values(data.syncMessage)
                );
                current = current ?? createDoc();
                const [nextDoc, nextSyncState, _patch] =
                  Automerge.receiveSyncMessage(
                    current,
                    syncStates[data.peerId]?.[id] || Automerge.initSyncState(),
                    data.syncMessage,
                    {
                      patchCallback: graphNodePatchCallback(true),
                    }
                  );
                persist &&
                  nodysseusidb.put("refs", Automerge.save(nextDoc), id);
                refsset.add(id);
                refsmap.set(id, nextDoc);
                const scd: Graph = structuredClone(nextDoc);
                scd.edges_in = {};
                Object.values(scd.edges).forEach((edge) => {
                  if (scd.edges_in[edge.to]) {
                    scd.edges_in[edge.to][edge.from] = { ...edge };
                  } else {
                    scd.edges_in[edge.to] = { [edge.from]: { ...edge } };
                  }
                });
                structuredCloneMap.set(id, scd);
                syncStates[data.peerId] = {
                  ...syncStates[data.peerId],
                  [id]: nextSyncState,
                };
                nodysseusidb.put(
                  "sync",
                  encodeSyncState(nextSyncState),
                  `${data.peerId}-${id}`
                );
                updatePeers(id);
                graphChangeCallback && graphChangeCallback(scd, []);
              });
            }
          } else if (messageType === "argsupdate") {
            try {
              ev.data
                .slice(1)
                .text()
                .then((dataText) => {
                  const message = JSON.parse(dataText);
                  if (message.source.id !== peerId) {
                    nolib.no.runtime.publish(
                      "argsupdate",
                      {
                        ...JSON.parse(dataText),
                        mutate: false,
                        source: { type: "ws", id: message.source.id },
                      },
                      nolibLib
                    );
                  }
                });
            } catch (e) {
              console.error(e);
            }
          }
        });
      });
    });
  }, 100);

  const updatePeersDebounces = {};

  return refs;
};
