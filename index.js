import { nodysseus } from "./nodysseus";

if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

nodysseus("node-editor");