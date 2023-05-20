import { nolib, NodysseusError, initStore, run } from "./nodysseus";
import {sharedWorkerRefStore, webClientStore} from "./editor/store"
import {isNodysseusError} from "./editor/util"
import { wrapPromise } from "./util";


function posterror(error, graph){
    if(isNodysseusError(error)) {
        self.postMessage({type: 'error', error: {node_id: error.cause.node_id, message: error.message}, graph});
    } else if(error) {
        self.postMessage({type: 'error', error: error?.message, graph});
    }
}

let initQueue = [];

const runningGraphs = new Map();

const processMessage = e => {
    try{
        // nolib.no.runtime.addListener(run_graph, 'graphrun', 'worker-rungraph', (g, result) => {
            // this.postMessage({type: 'result', result, graph: e.data.graph})
        // });
        const graph = e.data.graph;

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

        nolib.no.runtime.addListener('graphupdate', 'worker-graphupdate', ({graph}) => {
          if(runningGraphs.has(graph.id)) {
            run(runningGraphs.get(graph.id), undefined, {profile: false && performance.now() > 4000});
          }
        });

      
      wrapPromise(typeof e.data.graph === "string" 
        ? nolib.no.runtime.get_ref(e.data.graph)
        : e.data.graph).then(graph => {
          runningGraphs.set(graph.id, {...e.data, graph})
          run({...e.data, graph}, undefined, {profile: false && performance.now() > 4000})
        })
    } catch (e) { console.error(e) }
}

onmessage = e => e.data.kind === "connect" ? createStore(e.data.port) : initQueue ? initQueue.push(e) : processMessage(e);
self.postMessage({type: 'started'});


// const rtcpoly = {
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCIceCandidate
// }

const createStore = (port) => 
  webClientStore(() => sharedWorkerRefStore(port))
    .then(initStore)
    .then(() => {
      while(initQueue.length > 0){
        processMessage(initQueue.shift())
      }
      initQueue = false;
    })
