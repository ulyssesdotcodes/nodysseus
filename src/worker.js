import { nolib, NodysseusError, initStore, run } from "./nodysseus";
import {yNodyStore} from "./editor/store"

function posterror(graph, error){
    if(error instanceof NodysseusError) {
        self.postMessage({type: 'error', error: {node_id: error.node_id, message: error.message}, graph});
    } else {
        self.postMessage({type: 'error', error: error.message, graph});
    }
}

yNodyStore().then(initStore)

onmessage = function(e) {
    try{
      console.log("got runnable", e)
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

        console.log(e.data.args);

        run(e.data);
    } catch (e) { console.error(e) }
}
