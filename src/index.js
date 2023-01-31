import { editor, run} from './editor.js'

Promise.all(["json/simple.json"].map(url => fetch(url).then(e => e.json())))
    .then((examples) => {
        if('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js');
        }

        editor('node-editor')
    })
