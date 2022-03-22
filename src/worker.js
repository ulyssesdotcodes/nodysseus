import { runGraph } from "./nodysseus";

onmessage = function(e) {
    console.log(e.data)
    console.log(runGraph(e.data))
    // try{
        Promise.resolve(runGraph(e.data))
            .then(result => (console.log(result), this).postMessage({type: 'result', result, graph: e.data.graph}))
    //         .catch(e => this.postMessage({type: 'error'}));
    // } catch(e) {
    //     this.postMessage({type: 'error'})
    // }
}