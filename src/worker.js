import { nolib, NodysseusError, initStore, run } from "./nodysseus";
import {automergeStore} from "./editor/store"
import {isNodysseusError} from "./editor/util"
import { wrapPromise } from "./util";


function posterror(graph, error){
    if(isNodysseusError(error)) {
        self.postMessage({type: 'error', error: {node_id: error.node_id, message: error.message}, graph});
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

        nolib.no.runtime.addListener('grapherror', 'worker-grapherror', (g, error) => {
            if(error instanceof AggregateError) {
                error.errors.forEach(ae => {
                    console.error(ae)
                    posterror(e.data.graph, ae);
                });
            } else {
                console.error(error);
                posterror(e.data.graph, error);
            }

        });

        nolib.no.runtime.addListener('graphupdate', 'worker-graphupdate', (graph) => {
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

onmessage = e => initQueue ? initQueue.push(e) : processMessage(e);
self.postMessage({type: 'started'});


// const rtcpoly = {
//   RTCPeerConnection,
//   RTCSessionDescription,
//   RTCIceCandidate
// }

automergeStore()
  .then(initStore)
  .then(() => {
    console.log("init queue length", initQueue.length)
    while(initQueue.length > 0){
      processMessage(initQueue.shift())
    }
    initQueue = false;
  })
