import { openDB } from "idb";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs"
import generic from "../generic";
import { compare, lokidbToStore, nolib } from "../nodysseus";
import { Edge, EdgesIn, Graph, NodysseusNode, NodysseusStore } from "../types";
import { mapMaybePromise, wrapPromise } from "../util";
import { hlib } from "./util";
import Loki from "lokijs"
import {WebrtcProvider} from "y-webrtc";

const generic_nodes = generic.nodes;
const generic_node_ids = new Set(Object.keys(generic_nodes));

export const ydocStore = async (persist: false | string = false, useRtc = false, update = undefined) => {
  const rootDoc = new Y.Doc();
  const ydoc = new Y.Doc();
  rootDoc.getMap().set("ydoc", ydoc);
  const ymap: Y.Map<Y.Doc> = ydoc.getMap();
  const simpleYDoc = new Y.Doc();
  const simpleYMap = simpleYDoc.getMap();


  if(update !== undefined) {
    ymap.observeDeep(events =>{
      events.forEach((event: Y.YMapEvent<typeof ymap>) => {
      if(!event.transaction.local || event.transaction.origin === undoManager) {
        update(event)
      }

      simpleYDoc.transact(() => {
        for(let k of event.keysChanged) {
          if(k && ymap.get(k)?.isLoaded) {
            const graph = ymap.get(k)?.getMap().toJSON();
            graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
            simpleYMap.set(k, graph)
          }
        }
      })

      })
    })
  }

  const params = new URLSearchParams(location.search)
  let undoManager;

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

  const add = (id, data) => {
    if(generic_node_ids.has(id)) {
      generic_nodes[id].edges_in = Object.values(generic_nodes[id].edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
      simpleYMap.set(id, generic_nodes[id])
      return generic_nodes[id];
    } else if(id && !id.startsWith("_") && Object.keys(data).length > 0) {
      let current = ymap.get(id);
      let found = !!current?.guid; // && !!current.getMap().get("id");
      if(found !== false) {
        return wrapPromise(current.isLoaded ? true : (current.load(), current.whenLoaded)).then(_ => {
          const infomap = generic_nodes[id] ? current : current.getMap();
          setMapFromGraph(infomap, data)
          updateSimple(id)
          return simpleYMap.get(id)
        }).value

      } else {
        console.log("creating new ydoc")
        current = new Y.Doc();
        ymap.set(id, current);
        current.getMap().set("id", id)
        setMapFromGraph(current.getMap(), data)
        updateSimple(id)
        return simpleYMap.get(id)
      }
    }
  }

  const updateSimple = id => {
    if(id && ymap.get(id)?.getMap()?.get("id")) {
      const graph = ymap.get(id)?.getMap().toJSON();
      graph.edges_in = Object.values(graph.edges).reduce((acc: EdgesIn, edge: Edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
      simpleYMap.set(id, graph)
      nolib.no.runtime.publish('graphchange', simpleYMap.get(id), {...nolib, ...hlib}) 
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

    updateSimple(graphId)

  }

  const add_node = (graphId, node) => {
    if(generic_node_ids.has(graphId)) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).set(node.id, node)
    })

    updateSimple(graphId)
  }

  const remove_node = (graphId, node) => {
    if(generic_node_ids.has(graphId)) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("nodes") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(typeof node === "string" ? node : node.id);
    })

    updateSimple(graphId)
  }

  const add_edge = (graphId, edge) => {
    if(generic_nodes[graphId]) return;

    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).set(edge.from, edge)
    })

    updateSimple(graphId)
  }

  const remove_edge = (graphId, edge) => {
    ymap.get(graphId).transact(() => {
      (ymap.get(graphId).getMap().get("edges") as Y.Map<any>).delete(edge.from)
    })

    updateSimple(graphId)
  }

  if(persist !== undefined) {
    const prevdoc = new Y.Doc();

    const indexeddbProvider = new IndexeddbPersistence(`${persist}-subdocs`, ydoc)
    await indexeddbProvider.whenSynced
    const prevIndexeddbProvider = new IndexeddbPersistence(`${persist}`, prevdoc)
    prevIndexeddbProvider.whenSynced.then(val => {
      Promise.all([...prevdoc.getMap().keys()].map(k => {
        const addedkey = `__${k}__added_5`
        const prevdocmap = prevdoc.getMap().get(k) as Y.Map<any>;
        if(k.startsWith("_") || k === "" || generic_nodes[k] || prevdoc.getMap().get(addedkey)) {
        } else if ((prevdoc.getMap().get(k) as Graph).id) {
          // convert old maps to ymap
          console.log(`old maps ${k}`)
          return add(k, prevdoc.getMap().get(k))
        } else if (Array.isArray((prevdoc.getMap().get(k) as Y.Map<any>).get("nodes"))) {
          console.log(`old nodes ${k}`)
          const graph: Y.Map<any> = prevdocmap;
          const nodes = graph.get("nodes");
          const edges = graph.get("edges");
          const updatedNodes = new Y.Map();
          const updatedEdges = new Y.Map();
          nodes.forEach(n => updatedNodes.set(n.id, n))
          edges.forEach(e => updatedEdges.set(e.from, e))
        } else if (prevdocmap?.get("nodes")) {
          console.log("readding")
          console.log(k);
          console.log(prevdocmap)
          console.log(prevdocmap.toJSON())
          ymap.delete(k);
          add(k, prevdocmap.toJSON());
          prevdoc.getMap().set(addedkey, true)
        }
      }))
    })

    undoManager = new Y.UndoManager(ymap)
    undoManager.on('stack-item-popped', i => console.log(i))
  }

  // if(false !== undefined) {
  const refIdbs = {};
  const refRtcs = {};
  let rdocrtc;
  let rdoc: Y.Doc;

  const setuprtc = (rtcroom, sd, id) => {
    // console.log(`setup ${id}`)
    if(!rdoc) {
      rdoc = new Y.Doc({autoLoad: true})
      rootDoc.getMap().set("rdoc", rdoc)

      rdocrtc = new WebrtcProvider(`nodysseus${rtcroom}_subdocs`, rdoc, {
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

      rdocrtc.awareness.on("change", changes => {
        // console.log(Array.from(rdocrtc.awareness.getStates().values()))
      })

      rdoc.getMap().observe(evts => {
        // console.log("rdoc obs")
        // console.log(evts)

        rdocrtc.awareness.setLocalStateField("user", {
          name: "test",
          keysChanged: Array.from(evts.keysChanged.values()),
        })

        if(!refRtcs[id]) {
          refRtcs[id] = new WebrtcProvider(`nodysseus${rtcroom}_${id}`, sd, {
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
          });

          if(!rdoc.getMap().has(id)) {
            rdoc.getMap().set(id, sd.guid)
          }
        }

        evts.keysChanged.forEach(k => {
          const kguid = rdoc.getMap().get(k) as string;
          if(!ymap.has(k)) {
            // console.log(`got new graph ${k}`)
            const rsd = new Y.Doc({guid: kguid})
            ymap.set(k, rsd);
          }

          if(!refRtcs[k]) {
            refRtcs[k] = new WebrtcProvider(`nodysseus${rtcroom}_${k}`, ymap.get(k), {
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
          }
        })
      })

      // rdoc.on('update', evt => console.log(evt))
    } else {
      if(id && !rdoc.getMap().has(id)) {
        if(!refRtcs[id]) {
            refRtcs[id] = new WebrtcProvider(`nodysseus${rtcroom}_${id}`, sd, {
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
            })
        }
        rdoc.getMap().set(id, sd.guid)
      }
    }
  }

  ydoc.on('subdocs', e => {
    e.loaded.forEach(sd => {
      const sdmap = sd.getMap();
      if(!refIdbs[sd.guid]) {
        refIdbs[sd.guid] = new IndexeddbPersistence(`${persist}-subdocs-${sd.guid}`, sd)
        refIdbs[sd.guid].whenSynced.then(() => {
          sd.emit('load', [sd])

          if(!sdmap.get("id")){
            return;
          }

          if(sdmap.get("id")?.includes("/")) {
            debugger;
            ymap.delete(sdmap.get("id"))
            sd.destroy();
            refIdbs[sd.guid].clearData();
            return;
          }

          if(sdmap.get("id")) {
            updateSimple(sdmap.get("id"))
          }

          if(!(sdmap.get("id") === "custom_editor" || sdmap.get("id") === "keybindings")) {
            const custom_editor_res = nolib.no.runtime.get_ref("custom_editor");
            mapMaybePromise(custom_editor_res, custom_editor => {
              const rtcroom = params.get("rtcroom") ?? (custom_editor && hlib.run(custom_editor, custom_editor.out ?? "out")?.rtcroom);
              console.log("rtcroom", rtcroom);
              if(rtcroom && sdmap.get("id")) {
                setuprtc(rtcroom, sd, sd.getMap().get("id"));
              }
            })

            sd.getMap().observeDeep(event => {
              if(event[0].transaction.local === false) {
                updateSimple(sd.getMap().get("id"))
                update(event[0])
              }
            })
          }
            sd.on('synced', event => {
              console.log("synced")
              console.log(event);
              console.log(sd.guid)
              console.log(sd.getMap().toJSON())
            })
        })
      } else if (sdmap.get("id")) {
        debugger;
        updateSimple(sdmap.get("id"))
      }

    })
  })

  // }

  const get = (id, otherwise) => {
    if(generic_node_ids.has(id)) {
      return generic_nodes[id];
    }

    let simpleValue: Graph | undefined = simpleYMap.get(id) as Graph;
    if(simpleValue) {
      return simpleValue
    }

    if(ymap.has(id)) {
      // console.log("loading " + id)
      ymap.get(id)?.load()
      return ymap.get(id).whenLoaded.then((doc: Y.Doc) => {
        doc.transact(() => {
          // Sanitization and transforming from old to new
          const edgeReplaceMap = new Map<string, Map<string, string>>();
          let updateEdges = false;
          const docmap = doc.getMap();
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
        updateSimple(id);
        return simpleYMap.get(id);
      })
    }

    if(!(rdoc && rdoc.getMap().has(id)) && otherwise) {
      console.log("creating new " + id)
      return add(id, otherwise)
    }

    // TODO: if rdoc has it and it's not synced, what then?
  }

  return {
    get,
    add,
    add_node,
    remove_node,
    add_nodes_edges,
    add_edge,
    remove_edge,
    addMany: (datas) => {
      ydoc.transact(() => {
        datas.forEach(([id, data]) => add(id, data))
      })
    },
    remove: id => {
      console.log(`removing ${id}`)
      simpleYMap.delete(id);
      ymap.delete(id)
    },
    removeAll: () => {},
    all: () => {
      const keys = [...ymap.keys(), ...Object.keys(generic_nodes)];
      return keys//.map(v => get(v))
    },
    undo: persist && (() => undoManager.undo()),
    redo: persist && (() => undoManager.redo()),
  }
}

export const yNodyStore = async (useRtc: boolean = false): Promise<NodysseusStore> => {
  const db = new Loki("nodysseus.db", {
    env: "BROWSER",
    persistenceMethod: "memory",
  });

  const graphsdb = db.addCollection<{id: string, data: Graph}>("graphs", { unique: ["id"] });
  const statedb = db.addCollection<{id: string, data: Record<string, any>}>("state", { unique: ["id"] });
  const fnsdb = db.addCollection<{id: string, data: { script: string, fn: Function}}>("fns", { unique: ["id"] });
  const parentsdb = db.addCollection<{id: string, data: {parentest:string, parent: string}}>("parents", { unique: ["id"] });
  let nodysseusidb;

  await openDB("nodysseus", 2, {
    upgrade(db) {
      db.createObjectStore("assets")
    }
  }).then(db => { nodysseusidb = db })

  return {
    refs: await ydocStore('refs', useRtc, (event, id) => {
      // console.log(`update event`)
      // console.log(event);
      if(!id && event.keysChanged.size > 1) {
        return;
      }

      const updatedgraph = id ?? event.currentTarget.get("id");
      if(updatedgraph !== undefined) {
        requestAnimationFrame(() =>  {
          // console.log(updatedgraph);
          // console.log(nolib.no.runtime.get_ref(updatedgraph))
          nolib.no.runtime.change_graph(nolib.no.runtime.get_ref(updatedgraph), {...nolib, ...hlib}, event.transaction.local)
        }) 
      }
    }),
    parents: lokidbToStore(parentsdb),
    graphs: lokidbToStore(graphsdb),
    state: lokidbToStore(statedb),
    fns: lokidbToStore(fnsdb),
    assets: {
      get: (id) => nodysseusidb.get('assets', id),
      add: (id, blob) => nodysseusidb.put('assets', blob, id),
      remove: id => nodysseusidb.delete('assets', id),
      removeAll: () => nodysseusidb.clear('assets'),
      all: () => nodysseusidb.getAllKeys('assets'),
      addMany: bs => bs.map(([id, b]) => nodysseusidb.add('assets', b, id))
    }
  }
}
