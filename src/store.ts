import loki from "lokijs";
import generic from "./generic.js";
import { mapStore } from "./nodysseus.js";
import { Graph, LokiT, NodysseusStore, RefStore, Store } from "./types.js";

const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

export const lokidbToStore = <T>(
  collection: loki.Collection<LokiT<T>>,
): Store<T> => ({
  set: (id: string, data: T) => {
    const existing = collection.by("id", id);
    if (existing) {
      collection.update(Object.assign(existing, { data }));
    } else {
      collection.insert({ id, data });
    }
    return data;
  },
  get: (id: string) => collection.by("id", id)?.data,
  delete: (id: string) => {
    const existing = collection.by("id", id);
    if (existing !== undefined) {
      collection.remove(existing);
    }
  },
  clear: () => collection.clear(),
  keys: () => collection.where((_) => true).map((v) => v.id),
});

export const lokiStore = (): NodysseusStore => {
  const isBrowser = typeof window !== "undefined";
  const persistdb = new loki("nodysseus_persist.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  });
  const refsdb = persistdb.addCollection<LokiT<Graph>>("refs", {
    unique: ["id"],
  });

  const db = new loki("nodysseus.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  });

  // const graphsdb = db.addCollection<LokiT<Graph>>("nodes", { unique: ["id"] });
  // const statedb = db.addCollection<LokiT<any>>("state", { unique: ["id"] });
  // const fnsdb = db.addCollection<LokiT<{script: string, fn: Function}>>("fns", { unique: ["id"] });
  // const parentsdb = db.addCollection<LokiT<{parent: string, parentest: string}>>("parents", { unique: ["id"] });

  return {
    refs: {
      ...lokidbToStore<Graph>(refsdb),
      addFromUrl: () => {
        throw new Error("not implemented");
      },
      add_node: () => {
        throw new Error("not implemented");
      },
      add_nodes_edges: () => {
        throw new Error("not implemented");
      },
      remove_edge: () => {
        throw new Error("not implemented");
      },
      add_edge: () => {
        throw new Error("not implemented");
      },
      remove_node: () => {
        throw new Error("not implemented");
      },
    },
    parents: mapStore(),
    state: mapStore(),
    fns: mapStore(),
    assets: {
      get: (id) => {
        throw new Error("not implemented");
      },
      set: (id, value) => {
        throw new Error("not implemented");
      },
      delete: (id) => {
        throw new Error("not implemented");
      },
      clear: () => {
        throw new Error("not implemented");
      },
      keys: () => {
        throw new Error("not implemented");
      },
    },
    persist: {
      get: (id) => {
        throw new Error("not implemented");
      },
      set: (id, value) => {
        throw new Error("not implemented");
      },
      delete: (id) => {
        throw new Error("not implemented");
      },
      clear: () => {
        throw new Error("not implemented");
      },
      keys: () => {
        throw new Error("not implemented");
      },
    },
  };
};

export const objectRefStore = (graphs: Record<string, Graph>): RefStore => {
  return {
    get: (graphId) => {
      if (generic_nodes[graphId]) return generic_nodes[graphId];
      const graph = graphs[graphId];
      if (graph && !graph.edges_in) {
        graph.edges_in = {};
        Object.values(graph.edges).forEach((edge) => {
          if (graph.edges_in[edge.to]) {
            graph.edges_in[edge.to][edge.from] = { ...edge };
          } else {
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
    delete: (id: string) => {
      throw new Error("not implemented");
    },
    clear: () => {
      throw new Error("not implemented");
    },
    addFromUrl: (url: string) =>
      fetch(url)
        .then((res) => res.json())
        .then((refsToAdd) =>
          Promise.all(
            refsToAdd.map((ref: Graph) => {
              graphs[ref.id] = ref;
              return ref;
            }),
          ).then((gs) => gs),
        ),
    add_node: (graph, node) => {
      graphs[graph].nodes[node.id] = node;
      return graphs[graph];
    },
    add_edge: () => {
      throw new Error("not implemented");
    },
    remove_node: () => {
      throw new Error("not implemented");
    },
    remove_edge: () => {
      throw new Error("not implemented");
    },
    undo: () => {
      throw new Error("not implemented");
    },
    redo: () => {
      throw new Error("not implemented");
    },
    add_nodes_edges: () => {
      throw new Error("not implemented");
    },
  };
};

export const urlRefStore = (url: string): RefStore => {
  return {
    get: (id: string) => fetch(`${url}/${id}`, {mode: "cors"}).then((res) => res.json()),
    set: () => {
      throw new Error("not implemented");
    },
    addFromUrl: () => {
      throw new Error("not implemented");
    },
    keys: () => fetch(`${url}`).then(r => r.json()).then(r => r.graphs).catch(() => []),
    add_node: (graph, node) => {
      throw new Error("not implemented");
    },
    add_edge: () => {
      throw new Error("not implemented");
    },
    remove_node: () => {
      throw new Error("not implemented");
    },
    remove_edge: () => {
      throw new Error("not implemented");
    },
    undo: () => {
      throw new Error("not implemented");
    },
    redo: () => {
      throw new Error("not implemented");
    },
    add_nodes_edges: () => {
      throw new Error("not implemented");
    },
    delete: (id: string) => {
      throw new Error("not implemented");
    },
    clear: () => {
      throw new Error("not implemented");
    },
  }
}
