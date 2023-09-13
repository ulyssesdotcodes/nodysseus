import { Lib, RunOptions } from "./types.js";
export declare const initListeners: () => {
    publish: (event: any, data: any, lib: Lib, options?: RunOptions, broadcast?: boolean) => any;
    addListener: (event: any, listener_id: any, input_fn: any, remove?: boolean, graph_id?: boolean, prevent_initial_trigger?: boolean, lib?: Lib, options?: RunOptions) => any;
    pauseGraphListeners: (graph_id: string, paused: boolean) => boolean | Set<string>;
    removeListener: (event: any, listener_id: any) => void;
    isGraphidListened: (graphId: string) => boolean;
    isListened: (event: string, listenerId: string) => boolean;
    togglePause: (newPause: boolean) => boolean;
};
