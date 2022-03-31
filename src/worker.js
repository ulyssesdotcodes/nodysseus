import { nolib, NodysseusError } from "./nodysseus";

function posterror(graph, error){
    if(error instanceof NodysseusError) {
        self.postMessage({type: 'error', error: {node_id: error.node_id, message: error.message}, graph});
    } else {
        self.postMessage({type: 'error', error: error.message, graph});
    }
}

onmessage = function(e) {
    try{
        const run_graph = {...e.data.graph, out: e.data.fn};
        nolib.no.runtime.add_listener(run_graph, 'graphrun', 'worker-rungraph', (g, result) => {
            // this.postMessage({type: 'result', result, graph: e.data.graph})
        });

        nolib.no.runtime.add_listener(run_graph, 'grapherror', 'worker-grapherror', (g, error) => {
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

        nolib.no.runtime.update_graph(run_graph, e.data.args);
    } catch (e) { console.error(e) }
}