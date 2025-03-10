import { nolib, NodysseusError, initStore, nolibLib } from "./nodysseus";
import { sharedWorkerRefStore, webClientStore } from "./editor/store";
import { isNodysseusError } from "./editor/util";
import { wrapPromise, wrapPromiseAll } from "./util";
import { NodysseusRuntime } from "./dependency-tree/dependency-tree.js";

// function posterror(error, graph) {
//   if (isNodysseusError(error)) {
//     self.postMessage({
//       type: "error",
//       error: { node_id: error.cause.node_id, message: error.message },
//       graph,
//     });
//   } else if (error) {
//     self.postMessage({ type: "error", error: error?.message, graph });
//   }
// }

let initQueue = [];

// const runningGraphs = new Map();

let runtime;

const running = new Set();

const processMessage = (e) =>
  (console.log("got message", e), wrapPromiseAll)(
    [...e.data.env.data].map(
      (kv) =>
        wrapPromise(
          kv[1]?.__kind === "varNode"
            ? // runtime.fromNode(e.data.graph, kv[1].id.substring(kv[1].id.lastIndexOf("/") + 1))

              // .then(node => runtime.accessor(node, "value", kv[1].id + "-closurevalueMapOut", true))
              // .then(node => wrapPromise(runtime.runNode(node)).then(_ =>  node).value)
              wrapPromise(
                (runtime.varNode(
                  undefined,
                  undefined,
                  kv[1].id + "-refset",
                  true
                ),
                runtime.addListenerVarNode(kv[1].id, (id, value, source) => {}))
              ).then((setNode) =>
                runtime.mapNode(
                  {},
                  () => ({
                    __kind: "varNode",
                    id: kv[1].id,
                    get value() {
                      return setNode;
                    },
                  }),
                  () => false,
                  kv[1] + "value",
                  true
                )
              ).value
            : // ? wrapPromise(runtime.varNode(undefined, undefined, kv[1].id))
              runtime.constNode(kv[1], "workerclosure" + kv[0], false)
        ).then((v) => [kv[0], v]).value
    )
  )
    .then((kvs) =>
      runtime.fromNode(e.data.graph, e.data.fn, Object.fromEntries(kvs))
    )
    .then(
      (runNode) => {
        const run = async () => {
          const valueNode = runtime.accessor(
            runNode,
            "value",
            e.data.nodeGraphId + "-valueOutput",
            true
          );
          running.add(e.data.graph + "/" + e.data.fn);
          for await (const result of runtime.createWatch(valueNode)) {
          }
        };

        !running.has(e.data.graph + "/" + e.data.fn) && run();
        runtime.runNode(runNode);
      },
      (e) => console.error(e)
    );

onmessage = (e) =>
  e.data.kind === "connect"
    ? createStore(e.data.port)
    : initQueue
    ? initQueue.push(e)
    : processMessage(e);
self.postMessage({ type: "started" });

const createStore = (port) =>
  webClientStore(() => sharedWorkerRefStore(port))
    .then((store) => {
      initStore(store);
      const autorun =
        new URLSearchParams(location.search).get("norun") !== "true";
      runtime = new NodysseusRuntime(
        "worker",
        store,
        nolibLib,
        autorun ? "graphchange" : "graphchangeready"
      );
    })
    .then(() => {
      while (initQueue.length > 0) {
        processMessage(initQueue.shift());
      }
      initQueue = false;
    });
