import { Lib, Runnable, RunOptions } from "./types";
import { v4 as uuid } from "uuid";
import { ispromise, nolib, run } from "./nodysseus";
import { mergeLib, set_mutable } from "./util";

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
  const event_listeners = new Map<string, Map<string, Function | Runnable>>();
  const event_listeners_by_graph = new Map();
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
    // if(!isArgs(data)) {
    //   data = data ? new Map(Object.entries(data)) : {};
    // }
    if(event.startsWith("bc")) {
      event = event.substring(3);
    } else if(broadcast && event !== "noderun" && event !== "animationframe" && event !== "show_all") {
      try {
        if(typeof window !== "undefined") {
          eventsBroadcastChannel.postMessage({source: clientUuid, event: `bc-${event}`, data });
        } else if (event === "grapherror") {
          eventsBroadcastChannel.postMessage({source: clientUuid, event: `bc-${event}`, data: {message: data.message, node_id: data.node_id, stack: data.stack } });
        }
      } catch(e){
        // If it's not serializable, that's fine
        console.error(e);
      }
    }

    event_data.set(event, data);
    const listeners = getorset(event_listeners, event, () => new Map());

    if(!pause) {
      for (let l of listeners.values()) {
        try {
          if (typeof l === "function") {
            l(data, lib, {...options, timings: {}});
          } else if (typeof l === "object" && l.fn && l.graph) {
            run(
              l,
              Object.assign({}, l.args || {}, { data }),
              {...options, lib: mergeLib(l.lib, lib)}
            );
          }
        } catch(e) {
          console.error(e);
        }
      }
    }

    if (
      event === "animationframe" &&
      listeners.size > 0 && // the 1 is for the animationerrors stuff below
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
    const fn =
      typeof input_fn === "function"
        ? input_fn
        : (args) => {
            run(input_fn, args, {...options, lib: mergeLib(input_fn.lib, lib)});
          };
    if (!listeners.has(listener_id)) {
      if (!prevent_initial_trigger && event_data.has(event)) {
        try{
          fn(event_data.get(event));
        } catch(e){}
      }

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

    listeners.set(listener_id, fn);

  };

  // Adding a listener to listen for errors during animationframe. If there are errors, don't keep running.
  addListener('grapherror', "__system", e => animationerrors.push(e));
  addListener('graphchange', "__system", e => {
    if(animationerrors.length > 0) {
      event_listeners.get("animationframe")?.clear();
    }
    animationerrors.splice(0, animationerrors.length)
  });

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
      if(eventListener[0] !== "__system") {
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

  const removeGraphListeners = (graph_id, event) => {
    const graph_listeners = (graph_id === "*" ? [...event_listeners_by_graph.values()] : [event_listeners_by_graph.get(graph_id)])
      .filter(gl => gl)
      .map(gl => [...gl.entries()])
      .flat();
    if (graph_listeners) {
      for (const evt of graph_listeners) {
        getorset(event_listeners, evt[0])?.delete(evt[1]);
      }
    }
  };

  return {publish, addListener, removeGraphListeners, removeListener, togglePause: (newPause: boolean) => pause = newPause}
}
