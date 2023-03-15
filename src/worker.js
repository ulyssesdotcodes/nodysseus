import { nolib, NodysseusError, initStore, run } from "./nodysseus";
import {yNodyStore} from "./editor/store"

function posterror(graph, error){
    if(error instanceof NodysseusError) {
        self.postMessage({type: 'error', error: {node_id: error.node_id, message: error.message}, graph});
    } else if(error) {
        self.postMessage({type: 'error', error: error?.message, graph});
    }
}

yNodyStore().then(initStore).then(() => {
  onmessage = function(e) {
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

          run(e.data, undefined, {profile: false && this.performance.now() > 4000});
      } catch (e) { console.error(e) }
  }
})
