import { nodysseus } from "./nodysseus";
import examples from "./json/examples.json"

if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

const graph_list = JSON.parse(localStorage.getItem("graph_list"));
// const display_graph = {...DEFAULT_GRAPH, nodes: DEFAULT_GRAPH.nodes.map(n => ({...n})), edges: DEFAULT_GRAPH.edges.map(e => ({...e}))};
const hash_graph = window.location.hash.substring(1);
const stored = localStorage.getItem(hash_graph ?? graph_list?.[0]);
const simple = examples.find(g => g.id === 'simple');
// const original_graph = {...DEFAULT_GRAPH, nodes: [...DEFAULT_GRAPH.nodes].map(n => ({...n})), edges: [...DEFAULT_GRAPH.edges].map(e => ({...e}))};

let stored_graph;
try{ stored_graph = JSON.parse(stored); } catch(e){}

Promise.resolve(stored_graph ?? hash_graph ? fetch(`json/${hash_graph}.json`).then(r => r.json()).catch(_ => simple) : simple)
    .then(init_display_graph => nodysseus('node-editor', init_display_graph))