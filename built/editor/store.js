import { openDB } from "idb";
import generic from "../generic.js";
import { mapStore, nolib, nolibLib } from "../nodysseus.js";
import { isEdgesInGraph } from "../types.js";
import { wrapPromise } from "../util.js";
import { v4 as uuid } from "uuid";
import { expectSharedWorkerMessageResponse } from "./types.js";
const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));
export const addNode = (graph, node) => {
    if (graph.nodes[node.id]) {
        Object.keys(node).concat(Object.keys(graph.nodes[node.id]))
            .forEach(k => {
            if (graph.nodes[node.id][k] !== node[k]) {
                if (node[k] === undefined) {
                    delete graph.nodes[node.id][k];
                }
                else {
                    graph.nodes[node.id][k] = node[k];
                }
            }
        });
    }
    else {
        Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]]);
        graph.nodes[node.id] = node;
    }
    return graph;
};
export const removeNode = node => doc => {
    const nodeid = typeof node === "string" ? node : node.id;
    delete doc.nodes[nodeid];
    delete doc.edges[nodeid];
    if (doc.edges_in) {
        Object.values(doc.edges_in).forEach(ein => {
            if (ein[nodeid]) {
                delete ein[nodeid];
            }
        });
    }
};
export const addEdge = (g, edge) => {
    g.edges[edge.from] = edge;
    if (!g.edges_in) {
        g.edges_in = {};
        Object.values(g.edges).forEach((edge) => {
            if (g.edges_in[edge.to]) {
                g.edges_in[edge.to][edge.from] = { ...edge };
            }
            else {
                g.edges_in[edge.to] = { [edge.from]: { ...edge } };
            }
        });
    }
    if (g.edges_in[edge.to] === undefined)
        g.edges_in[edge.to] = {};
    g.edges_in[edge.to][edge.from] = edge;
    return g;
};
export const removeEdge = edge => g => {
    delete g.edges[edge.from];
    if (Object.hasOwn(g, "edges_in")) {
        delete g.edges_in[edge.to][edge.from];
    }
};
export const addNodesEdges = (graph, addedNodes = [], addedEdges = [], removedNodes = [], removedEdges = []) => {
    removedNodes?.forEach(node => removeNode(node)(graph));
    removedEdges?.forEach(edge => removeEdge(edge)(graph));
    addedNodes.forEach(node => {
        Object.entries(node).forEach(kv => kv[1] === undefined && delete node[kv[0]]);
        graph.nodes[node.id] = node;
    });
    addedEdges.forEach(edge => {
        graph.edges[edge.from] = edge;
        if (isEdgesInGraph(graph)) {
            if (graph.edges_in[edge.to]) {
                graph.edges_in[edge.to][edge.from] = { ...edge };
            }
            else {
                graph.edges_in[edge.to] = { [edge.from]: { ...edge } };
            }
        }
    });
    return graph;
};
const typedPostMessage = (port, m) => port.postMessage(m);
export const initPort = (store, ports, port) => {
    ports.push(port);
    port.addEventListener("message", (e) => {
        if (store.value) {
            processMessage(store.value, ports, port, e.data);
        }
        else {
            store.initQueue.push([port, e.data]);
        }
        if (e.data.kind === "disconnect") {
            ports.splice(ports.indexOf(port), 1);
        }
    });
    port.start();
    port.postMessage({ kind: "connect" });
};
const sendUpdateMessages = (ports, originPort) => (graphs) => ports
    .filter(p => p !== originPort)
    .forEach(p => typedPostMessage(p, { kind: (console.log("sending update", graphs), "update"), graphs: Array.isArray(graphs) ? graphs : [graphs] }));
export const processMessage = (store, ports, port, m) => (m.kind === "addPort"
    ? wrapPromise(initPort({ value: store, initQueue: [] }, ports, m.port))
    : m.kind === "get"
        ? wrapPromise(store.get(m.graphId))
            .then(graph => typedPostMessage(port, { kind: "get", messageId: m.messageId, graph }))
        : m.kind === "keys"
            ? wrapPromise(store.keys())
                .then(keys => typedPostMessage(port, { kind: "keys", messageId: m.messageId, keys }))
            : m.kind === "add_node"
                ? wrapPromise(store.add_node(m.graphId, m.node)).then(sendUpdateMessages(ports, port))
                : m.kind === "add_edge"
                    ? wrapPromise(store.add_edge(m.graphId, m.edge)).then(sendUpdateMessages(ports, port))
                    : m.kind === "add_nodes_edges"
                        ? wrapPromise(store.add_nodes_edges(m)).then(sendUpdateMessages(ports, port))
                        : m.kind === "set"
                            ? wrapPromise(store.set(m.graph.id, m.graph)).then(sendUpdateMessages(ports, port))
                            : m.kind === "delete"
                                ? wrapPromise(store.delete(m.graphId))
                                : m.kind === "addFromUrl"
                                    ? wrapPromise(store.addFromUrl(m.url)).then(gs => {
                                        typedPostMessage(port, { kind: "addFromUrl", messageId: m.messageId, graphs: gs });
                                        sendUpdateMessages(ports, port)(gs);
                                    })
                                    : wrapPromise(false));
export const sharedWorkerRefStore = async (port) => {
    const inflightRequests = new Map();
    let connectres;
    const connectPromise = new Promise((res, rej) => connectres = res);
    port.onmessageerror = e => console.error("shared worker error", e);
    onerror = e => console.error("shared worker error", e);
    port.addEventListener('message', (e) => e.data.kind === "connect"
        ? connectres()
        : e.data.kind === "update"
            ? e.data.graphs.forEach(graph => {
                nolib.no.runtime.change_graph(graph, nolibLib);
                contextKeysCache.add(graph.id);
                contextGraphCache.set(graph.id, graph);
            })
            : expectSharedWorkerMessageResponse(e.data) && inflightRequests.get(e.data.messageId)(e.data));
    self.addEventListener('beforeunload', () => port.postMessage({ kind: "disconnect" }));
    port.start();
    await connectPromise;
    const sendMessage = (message) => { port.postMessage(message); };
    const messagePromise = (request) => {
        const message = {
            messageId: uuid(),
            ...request
        };
        sendMessage(message);
        return new Promise((res, rej) => {
            inflightRequests.set(message.messageId, e => res(e));
        });
    };
    let hasSharedWorkerKeys = false;
    const contextKeysCache = new Set();
    const contextGraphCache = new Map();
    setTimeout(() => nolib.no.runtime.addListener("graphchange", "__system-store", ({ graph, source }) => {
        if (source === "automergeStore") {
            contextKeysCache.add(graph.id);
            contextGraphCache.set(graph.id, graph);
        }
    }), 100);
    return {
        get: graphId => generic_nodes[graphId] ??
            contextGraphCache.get(graphId) ??
            messagePromise({ kind: "get", graphId })
                .then(e => e.graph)
                .then(graph => (contextGraphCache.set(graphId, graph), contextKeysCache.add(graphId), graph)),
        addFromUrl: url => messagePromise({ kind: "addFromUrl", url }).then(e => e.graphs)
            .then(gs => gs.map(graph => {
            contextGraphCache.set(graph.id, graph);
            contextKeysCache.add(graph.id);
            return graph;
        })),
        set: (k, g) => {
            sendMessage({ kind: "set", graph: g });
            return g;
        },
        delete: (k) => sendMessage({ kind: "delete", graphId: k }),
        clear: () => { throw new Error("not implemented"); },
        keys: () => hasSharedWorkerKeys
            ? [...contextKeysCache.values()]
            : messagePromise({ kind: "keys" }).then(e => (e.keys.forEach(k => k && contextKeysCache.add(k)), hasSharedWorkerKeys = true, e.keys.filter(k => k))),
        add_edge: () => { throw new Error("not implemented"); },
        remove_edge: () => { throw new Error("not implemented"); },
        add_node: (graphId, node) => {
            sendMessage({ kind: "add_node", graphId, node });
            const graphClone = structuredClone(contextGraphCache.get(graphId));
            const graphAddedNode = addNode(graphClone, node);
            contextGraphCache.set(graphId, graphAddedNode);
            return graphAddedNode;
        },
        remove_node: () => { throw new Error("not implemented"); },
        add_nodes_edges: ({ graphId, addedNodes, addedEdges, removedEdges, removedNodes }) => {
            sendMessage({ kind: "add_nodes_edges", graphId, addedNodes, addedEdges, removedNodes, removedEdges });
            const graphClone = structuredClone(contextGraphCache.get(graphId));
            const graphAddedNodesEdges = addNodesEdges(graphClone, addedNodes, addedEdges, removedNodes, removedEdges);
            contextGraphCache.set(graphId, graphAddedNodesEdges);
            return graphAddedNodesEdges;
        }
    };
};
export const openNodysseusDB = () => openDB("nodysseus", 5, {
    upgrade(db, oldVersion, newVersion) {
        if (oldVersion < 2) {
            db.createObjectStore("assets");
        }
        if (oldVersion < 3) {
            db.createObjectStore("persist");
        }
        if (oldVersion < 4) {
            db.createObjectStore("refs");
        }
        if (oldVersion < 5) {
            db.createObjectStore("sync");
        }
    }
});
export const webClientStore = async (refStore) => {
    const nodysseusidb = await openNodysseusDB();
    return {
        refs: await refStore(nodysseusidb),
        parents: mapStore(),
        state: mapStore(),
        fns: mapStore(),
        assets: {
            get: (id) => nodysseusidb.get('assets', id),
            set: (id, blob) => (nodysseusidb.put('assets', blob, id), blob),
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
    };
};
export const objectRefStore = (graphs) => {
    return {
        get: graphId => {
            if (generic_nodes[graphId])
                return generic_nodes[graphId];
            const graph = graphs[graphId];
            if (graph && !graph.edges_in) {
                graph.edges_in = {};
                Object.values(graph.edges).forEach(edge => {
                    if (graph.edges_in[edge.to]) {
                        graph.edges_in[edge.to][edge.from] = { ...edge };
                    }
                    else {
                        graph.edges_in[edge.to] = { [edge.from]: { ...edge } };
                    }
                });
            }
            return graph;
        },
        set: (id, data) => {
            graphs[id] = data;
            return data;
        },
        keys: () => Object.keys(generic_nodes).concat(Object.keys(graphs)),
        delete: (id) => { throw new Error("not implemented"); },
        clear: () => { throw new Error("not implemented"); },
        addFromUrl: (url) => fetch(url)
            .then(res => res.json())
            .then(refsToAdd => Promise.all(refsToAdd.map((ref) => {
            graphs[ref.id] = ref;
            return ref;
        })).then(gs => gs)),
        add_node: () => { throw new Error("not implemented"); },
        add_edge: () => { throw new Error("not implemented"); },
        remove_node: () => { throw new Error("not implemented"); },
        remove_edge: () => { throw new Error("not implemented"); },
        undo: () => { throw new Error("not implemented"); },
        redo: () => { throw new Error("not implemented"); },
        add_nodes_edges: () => { throw new Error("not implemented"); },
    };
};
