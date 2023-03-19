import { editor, run} from './editor/editor.ts'

if('serviceWorker' in navigator) {
  console.log("installing serviceworker")
  navigator.serviceWorker.register('./sw.js');
}

editor('node-editor')//, new Worker("./worker.js", {type: "module"}))
