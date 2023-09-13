import { Args, ConstRunnable, Env, Lib } from "./types.js";
export declare const parseValue: (value: any) => any;
export declare const create_fn: (runnable: ConstRunnable, lib: Lib) => (args: Env | Args | Record<string, unknown>, ...rest: any[]) => any;
export declare const now: (scale?: number) => number;
export declare const expect: (a: any, b: any, value: string) => any;
