import { ApFunctorLike, Graph, isApFunction, isApRunnable, isConstRunnable, isError, isFunctorRunnable, isRunnable, isValue, Lib, NodysseusNode, Runnable, RunOptions } from "./types";
import { v4 as uuid } from "uuid";
import { ispromise, nolib, run } from "./nodysseus";
import { mergeLib, set_mutable, wrapPromise } from "./util";
import { listen } from "./editor/util";

const getorset = (map, id, value_fn=undefined) => {
    let val = map.get(id);
    if (val) {
        return val;
    } else {
        let val = value_fn();
        if (val !== undefined) {
            map.set(id, val);
        }
        return val
    }
}

export const initListeners = () => {
  const hasRequestAnimationFrame = typeof requestAnimationFrame !== "undefined";
  const event_listeners = new Map<string, Map<string, {fn: Function | Runnable, graphid?: string}>>();
  const event_listeners_by_graph = new Map<string, Map<string, string>>();
  const pausedGraphIds = new Set<string>();
  const event_data = new Map(); // TODO: get rid of this
  let animationframe;
  let animationerrors = [];
  let pause = false;

  let eventsBroadcastChannel = new BroadcastChannel("events");
  let clientUuid = uuid();

  eventsBroadcastChannel.onmessage = (message) => {
    runpublish(message.data.data, message.data.event, nolib)
  }

  const runpublish = (data, event, lib, options: RunOptions = {}, broadcast = true) => {
    if(event.startsWith("bc")) {
      event = event.substring(3);
    } else if(broadcast && event !== "noderun" && event !== "animationframe" && event !== "show_all") {
      try {
        if (event === "grapherror") {
          eventsBroadcastChannel.postMessage({source: clientUuid, event: `bc-${event}`, data: {message: data.message, node_id: data.node_id, stack: data.stack } });
        } else {
          eventsBroadcastChannel.postMessage({source: clientUuid, event: `bc-${event}`, data });
        }
      } catch(e){
        // If it's not serializable, that's fine
        console.error(e);
      }
    }


    event_data.set(event, data);
    const listenerMap: ReturnType<(typeof event_listeners)["get"]> = getorset(event_listeners, event, () => new Map());
    const listeners = [...listenerMap.entries()]

    const runlistener = (l: Function | Runnable) => {
      try {
        if (typeof l === "function") {
          l(data, lib, {...options, timings: {}});
        } else if (typeof l === "object" && !isValue(l) && !isError(l)) {
          run(
            l,
            Object.assign({}, isApRunnable(l) ? l.args : {}, { data }),
            {...options, lib: mergeLib(l.lib, lib)}
          );
        }
      } catch(e) {
        console.error(e);
      }
    }

    listeners.filter(l => l[0].startsWith("__system")).forEach(l => runlistener(l[1].fn))

    // When paused allow graphchange and grapherror so the graph shows
    if(!pause || event === "graphchange" || event === "grapherror") {
      for (let l of listeners) {
        if(!l[0].startsWith("__system") && !(l[1].graphid && [...pausedGraphIds.keys()].find(k => l[1].graphid.startsWith(k)))) runlistener(l[1].fn)
        // runlistener(l)
      }
    }

    if (
      event === "animationframe" &&
      listenerMap.size > 0 && // the 1 is for the animationerrors stuff below
      !animationframe &&
      animationerrors.length == 0 &&
      hasRequestAnimationFrame
    ) {
      animationframe = requestAnimationFrame(() => {
        animationframe = false;
        publish("animationframe", undefined, lib, options);
      });
    }
  };

  const publish = (event, data, lib: Lib, options: RunOptions = {}, broadcast = true) => {
    if (typeof data === "object" && ispromise(data)) {
      data.then(d => runpublish(d, event, lib, options, broadcast));
    } else {
      runpublish(data, event, lib, options, broadcast);
    }

    return data;
  };

  const addListener = (
    event,
    listener_id,
    input_fn,
    remove = false,
    graph_id = false,
    prevent_initial_trigger = false,
    lib: Lib = {__kind: "lib", data: nolib},
    options: RunOptions = {}
  ) => {
    if(ispromise(input_fn)) {
      return input_fn.then(fn => addListener(event, listener_id, fn, remove, graph_id, prevent_initial_trigger, lib, options))
    }

    const listeners = getorset(event_listeners, event, () => new Map());
    const replaceGraphs = (runnable: Runnable | ApFunctorLike) =>
      isApFunction(runnable) || typeof runnable === "function" || isValue(runnable) || isError(runnable) || runnable === undefined || (isFunctorRunnable(runnable) && typeof runnable.graph === "object")
        ? runnable
        : isApRunnable(runnable) 
        ? {...runnable, fn: Array.isArray(runnable.fn) ? runnable.fn.map(replaceGraphs) : replaceGraphs(runnable.fn)}
        : wrapPromise(lib.data.no.runtime.get_ref(runnable.graph)).then(graph => ({...runnable, graph})).value

    const fn =
      typeof input_fn === "function"
        ? input_fn
        : (args) => {
            wrapPromise(replaceGraphs(input_fn)).then(replaced => run(replaced, args, {...options, lib: mergeLib(input_fn.lib, lib)}));
          };
    if (!listeners.has(listener_id)) {
      if (graph_id) {
        const graph_id_listeners = getorset(
          event_listeners_by_graph,
          graph_id,
          () => new Map()
        );
        graph_id_listeners.set(event, listener_id);
      }

      if (event === "animationframe" && hasRequestAnimationFrame) {
        requestAnimationFrame(() => publish(event, undefined, lib, options));
      }
    }

    if (remove) {
      removeListener(event, listener_id);
    }

    listeners.set(listener_id, {fn, graphid: graph_id});
  };

  // Adding a listener to listen for errors during animationframe. If there are errors, don't keep running.
  addListener('grapherror', "__system", e => animationerrors.push(e));

  
  const systemgraphchangelistener = ({graph, dirtyNodes}: {graph: Graph, dirtyNodes: Array<NodysseusNode>}) => {
    if(animationerrors.length > 0) {
      event_listeners.get("animationframe")?.clear();
    }

    animationerrors.splice(0, animationerrors.length)

    // dirtyNodes?.forEach(n => {
    //   pauseGraphListeners(`${graph.id}/${n}`);
    // })
  }
  addListener('graphchange', "__system", systemgraphchangelistener);
  addListener('graphupdate', "__system", systemgraphchangelistener);

  addListener('argsupdate', '__system', ({graphid, changes, mutate}, lib, options) => {
    if(mutate) {
      const current = nolib.no.runtime.get_args(graphid);
      changes.forEach(change => set_mutable(current, change[0], change[1]))
    } else {
      nolib.no.runtime.update_args(graphid, changes, lib)
    }
  })

  addListener('cachedelete', "__system", e => nolib.no.runtime.clearState());

  addListener('listenersclear', "__system", e => {
    for(let eventListener of event_listeners.entries()) {
      if(eventListener[0].startsWith("__system")) {
        eventListener[1].clear()
      }
    }

    event_listeners_by_graph.clear();
  });

  const removeListener = (event, listener_id) => {
    if (event === "*") {
      [...event_listeners.values()].forEach((e) => e.delete(listener_id));
    } else {
      const listeners = getorset(event_listeners, event, () => new Map());
      listeners.delete(listener_id);
    }
  };

  const pauseGraphListeners = (graph_id: string, paused: boolean) => 
    paused ? pausedGraphIds.add(graph_id) : pausedGraphIds.delete(graph_id)

  const isGraphidListened = (graphId: string) => event_listeners_by_graph.has(graphId);
  const isListened = (event: string, listenerId: string) => event_listeners.get(event)?.has(listenerId);

  return {publish, addListener, pauseGraphListeners, removeListener, isGraphidListened, isListened, togglePause: (newPause: boolean) => pause = newPause }
}
