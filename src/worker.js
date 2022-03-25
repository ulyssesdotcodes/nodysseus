import { nolib } from "./nodysseus";

onmessage = function(e) {
    try{
        const run_graph = {...e.data.graph, out: e.data.fn};
        nolib.no.runtime.add_listener(run_graph, 'rungraph', 'worker-rungraph', (g, result) => {
            this.postMessage({type: 'result', result, graph: e.data.graph})
        });

        nolib.no.runtime.add_listener(run_graph, 'grapherror', 'worker-grapherror', (g, e) => {
            if(e instanceof AggregateError) {
                e.errors.forEach(ae => console.error(ae));
            }
        });

        nolib.no.runtime.update_graph(run_graph)
    } catch (e) { console.error(e) }
}