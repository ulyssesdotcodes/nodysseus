import { editor, run} from './editor.js'

if('serviceWorker' in navigator) {
  console.log("installing serviceworker")
  navigator.serviceWorker.register('./sw.js');
}

editor('node-editor')
