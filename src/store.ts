import loki from "lokijs"
import { mapStore } from "./nodysseus.js"
import { Graph, LokiT, NodysseusStore, Store } from "./types.js"

export const lokidbToStore = <T>(collection: loki.Collection<LokiT<T>>): Store<T> => ({
  set: (id: string, data: T) => {
    const existing = collection.by("id", id)
    if (existing) {
      collection.update(Object.assign(existing, {data}))
    } else {
      collection.insert({ id,  data})
    }
    return data
  },
  get: (id: string) => collection.by("id", id)?.data,
  delete: (id: string) => {
    const existing = collection.by("id", id)
    if(existing !== undefined){
      collection.remove(existing)
    }
  },
  clear: () => collection.clear(),
  keys: () => collection.where(_ => true).map(v => v.id),
})

export const lokiStore = (): NodysseusStore => {
  const isBrowser = typeof window !== "undefined"
  const persistdb = new loki("nodysseus_persist.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  })
  const refsdb = persistdb.addCollection<LokiT<Graph>>("refs", {unique: ["id"]})

  const db = new loki("nodysseus.db", {
    env: isBrowser ? "BROWSER" : "NODEJS",
    persistenceMethod: "memory",
  })


  // const graphsdb = db.addCollection<LokiT<Graph>>("nodes", { unique: ["id"] });
  // const statedb = db.addCollection<LokiT<any>>("state", { unique: ["id"] });
  // const fnsdb = db.addCollection<LokiT<{script: string, fn: Function}>>("fns", { unique: ["id"] });
  // const parentsdb = db.addCollection<LokiT<{parent: string, parentest: string}>>("parents", { unique: ["id"] });

  return {
    refs: {
      ...lokidbToStore<Graph>(refsdb), 
      addFromUrl: () => { throw new Error("not implemented")},
      add_node: () => { throw new Error("not implemented")}, 
      add_nodes_edges: () => { throw new Error("not implemented")}, 
      remove_edge: () => { throw new Error("not implemented")},
      add_edge: () => { throw new Error("not implemented")},
      remove_node: () => { throw new Error("not implemented")},
    },
    parents: mapStore(),
    state: mapStore(),
    fns: mapStore(),
    assets: {
      get: id => { throw new Error("not implemented")},
      set: (id, value) => { throw new Error("not implemented")},
      delete: id => { throw new Error("not implemented")},
      clear: () => { throw new Error("not implemented")},
      keys: () => {  throw new Error("not implemented")}
    },
    persist: {
      get: id => { throw new Error("not implemented")},
      set: (id, value) => { throw new Error("not implemented")},
      delete: id => { throw new Error("not implemented")},
      clear: () => { throw new Error("not implemented")},
      keys: () => {  throw new Error("not implemented")}
    }
  }
}
