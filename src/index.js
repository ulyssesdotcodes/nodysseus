import { editor, run} from './editor.js'

Promise.all(["json/simple.json", "json/simple_html_hyperapp.json"].map(url => fetch(url).then(e => e.json())))
    .then((examples) => {
        // if('serviceWorker' in navigator) {
        //     navigator.serviceWorker.register('./sw.js');
        // }

        console.log(editor);
        editor('node-editor')
    })