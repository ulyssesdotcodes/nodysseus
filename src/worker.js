import { nolib, NodysseusError, initStore, run } from "./nodysseus";
import {yNodyStore} from "./editor/store"
import {isNodysseusError} from "./editor/util"

function posterror(graph, error){
    if(isNodysseusError(error)) {
        self.postMessage({type: 'error', error: {node_id: error.node_id, message: error.message}, graph});
    } else if(error) {
        self.postMessage({type: 'error', error: error?.message, graph});
    }
}

let initQueue = [];

const processMessage = e => {
    try{
        // nolib.no.runtime.add_listener(run_graph, 'graphrun', 'worker-rungraph', (g, result) => {
            // this.postMessage({type: 'result', result, graph: e.data.graph})
        // });

        nolib.no.runtime.add_listener('grapherror', 'worker-grapherror', (g, error) => {
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

      console.log("got data", e.data);
        run(e.data, undefined, {profile: false && this.performance.now() > 4000});
    } catch (e) { console.error(e) }
}

onmessage = e => initQueue ? initQueue.push(e) : processMessage(e);

yNodyStore()
  .then(initStore)
  .then(() => {
    console.log("init queue length", initQueue.length)
    while(initQueue.length > 0){
      processMessage(initQueue.shift())
    }
    initQueue = false;
  })
