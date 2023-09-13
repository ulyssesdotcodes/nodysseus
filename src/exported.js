import {objectRefStore, webClientStore} from "./editor/store";
import strudelExample from "../public/json/strudel-example.json";
import {nolib, nolibLib, initStore} from "./nodysseus"
import { newEnv } from "./util";
import * as ha from "hyperapp";
import { middleware, run_h } from "./editor/hyperapp";


const store = await webClientStore(() => Promise.of(objectRefStore(Object.fromEntries(strudelExample.graphs.map(graph => [graph.id, graph])))))
initStore(store);

const display = await nolib.no.runtime.run({
  graph: "strudel_example", 
  env: newEnv(new Map([["__graphid", nolib.no.of("strudel_example")]]), "display"),
  fn: strudelExample.graphs.find(g => g.id === "strudel_example").out,
  lib: nolibLib
});


ha.app({
  dispatch: middleware,
  init: {hDisplay: display},
  view: ({hDisplay}) => run_h(hDisplay),
  node: document.getElementById("graph-display")
})
