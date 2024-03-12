import { nolib, NodysseusError, initStore, run, nolibLib } from "./nodysseus"
import {sharedWorkerRefStore, webClientStore} from "./editor/store"
import {isNodysseusError} from "./editor/util"
import { wrapPromise, wrapPromiseAll } from "./util"
import { NodysseusRuntime,  isNothing } from "./dependency-tree/dependency-tree.js"


function posterror(error, graph){
  if(isNodysseusError(error)) {
    self.postMessage({type: "error", error: {node_id: error.cause.node_id, message: error.message}, graph})
  } else if(error) {
    self.postMessage({type: "error", error: error?.message, graph})
  }
}

let initQueue = []

const runningGraphs = new Map()

let runtime;

const processMessage = e => {
    const graph = e.data.graph
    wrapPromiseAll([...e.data.env.data].map(e => wrapPromise(e[1]?.__kind === "varNode" ? wrapPromise(runtime.fromNode(graph, e[1].id.substring(e[1].id.lastIndexOf("/") + 1))).then(node => runtime.accessor(node, "value", e[1].id + "-closurevalueMapOut", false)).value : e[1]).then(v => [e[0], v]).value))
      .then(kvs =>
        runtime.fromNode(
          graph, 
          e.data.fn,
          Object.fromEntries(kvs)
        )
      ).then(runNode => {
        const run = async () => {
          const valueNode = runtime.accessor(runNode, "value", e.data.nodeGraphId + "-valueOutput", true);
          for await (const result of runtime.createWatch(valueNode)) {
            console.log("watch node output", result)
          }
        }

        run();
        runtime.runNode(runNode)
      },
        e => console.error(e)
      )
}

onmessage = e => e.data.kind === "connect" ? createStore(e.data.port) : initQueue ? initQueue.push(e) : processMessage(e)
self.postMessage({type: "started"})

const createStore = (port) => 
  webClientStore(() => sharedWorkerRefStore(port))
    .then(store => {
      initStore(store);
      runtime = new NodysseusRuntime("worker", store, nolibLib);
    }) 
    .then(() => {
      while(initQueue.length > 0){
        processMessage(initQueue.shift())
      }
      initQueue = false
    })
