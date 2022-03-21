import { runGraph } from "./nodysseus";

onmessage = function(e) {
    console.log(e)
    // try{
        Promise.resolve(runGraph(e.data))
            .then(result => this.postMessage({type: 'result', result}))
    //         .catch(e => this.postMessage({type: 'error'}));
    // } catch(e) {
    //     this.postMessage({type: 'error'})
    // }
}