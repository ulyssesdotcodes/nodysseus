import { editor, run} from './editor/editor.ts'

if (!window.IS_PRODUCTION) new EventSource('/esbuild').addEventListener('change', () => location.reload())

if('serviceWorker' in navigator) {
  console.log("installing serviceworker")
  navigator.serviceWorker.register('./sw.js');
} else {
  console.log("couldn't install serviceworker")
}

editor('node-editor')
