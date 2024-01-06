import { nolib, NodysseusError, initStore, run, nolibLib } from "./nodysseus"
import {sharedWorkerRefStore, webClientStore} from "./editor/store"
import {isNodysseusError} from "./editor/util"
import { wrapPromise } from "./util"
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
  try{
    // nolib.no.runtime.addListener(run_graph, 'graphrun', 'worker-rungraph', (g, result) => {
    // this.postMessage({type: 'result', result, graph: e.data.graph})
    // });
    const graph = e.data.graph

    // nolib.no.runtime.addListener('grapherror', 'worker-grapherror', (error) => {
    //     if(error instanceof AggregateError) {
    //         error.errors.forEach(ae => {
    //             console.error(ae)
    //             posterror(ae, graph);
    //         });
    //     } else {
    //         console.error(error);
    //         posterror(error, graph);
    //     }
    //
    // });
    runtime.fromNode(graph, e.data.fn).then(nodeNode => runtime.runNode(nodeNode)).then(
      runNode =>  {

        const run = async (_output) => {
          for await(const value of runtime.createWatch(runNode[_output], _output)) {
            const val = await value(e.data.env.data)
            // console.log("worker output", val);
          }
        }
        // console.log("run node", runNode)

        wrapPromise(runtime.run(runNode.value))
          .then(async value => {
            await value(e.data.env.data)
            // console.log("first worker value", );
            run("value");
          })
      }
    ).catch(e => console.error(e))
  } catch (e) { console.error(e) }
}

onmessage = e => e.data.kind === "connect" ? createStore(e.data.port) : initQueue ? initQueue.push(e) : processMessage(e)
self.postMessage({type: "started"})


// const rtcpoly = {
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCIceCandidate
// }

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
