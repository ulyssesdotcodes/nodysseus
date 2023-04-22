import * as util from "./util"
import {nodysseus_get, resolve_args} from "./nodysseus"
import { NodysseusNode, Graph, Args, ConstRunnable, Env, isArgs, isEnv, isError, isNodeRef, isNodeScript, isValue, Lib, RefNode, Result, Runnable } from "./types";


const nodeinputs = (node: NodysseusNode, graph: Graph) => Object.values(graph.edges_in[node.id] ?? []).map(edge => ({edge, node: graph.nodes[edge.from]}));
const nodefn = (node) => isNodeRef(node) && node.ref === "arg" ? createArg(node.value) : `fn_${node.id}()`;
const createArg = (name) => `fnargs["${argToProperties(name)}"] ?? baseArgs["${argToProperties(name)}"]` 
const argToProperties = (arg: string) => arg.includes('.') ? arg.split('.').join('"]?.["') : arg;


const graphToFnBody = (runnable: ConstRunnable, lib: Lib) => {
    const graph = util.ancestor_graph(runnable.fn, runnable.graph, lib.data);
    const graphArgs = new Set(Object.values(graph.nodes).filter<RefNode>(isNodeRef).filter(n => n.ref === "arg").map(a => a.value));


    return util.wrapPromise(resolve_args(new Map([...graphArgs].map(a => [a, nodysseus_get(runnable.env, a, lib)])), lib, {resolvePromises: true}))
      .then(result => {
        if(!isValue(result)) return;
        const baseArgs = typeof result.value?.includes === "function" && result.value.includes(".") ? result.value.substring(0, result.value.indexOf(".")) : result.value;
        graph.id = runnable.fn + "-fn";

        let text = "";
        const _extern_args = {};


        Object.values(graph.nodes).forEach(n => {
          const args = util.node_args(lib.data, graph, n.id)
          if(isNodeRef(n) && n.ref === "arg") {
            return;
          }
          const noderef = isNodeRef(n) ? lib.data.no.runtime.get_ref(n.ref) : n;
          if(isNodeScript(n) || (isNodeRef(n) && n.ref === "@js.script")) {
            let inputs = nodeinputs(n, graph)
            text += `
function fn_${n.id}(){
  ${inputs.map(input => 
    `let ${input.edge.as} = ${nodefn(input.node)};`
  ).join("\n")
}

${isNodeScript(n) ? n.script : n.value}

}

`
          } else if (noderef.id === "@data.get"){
            let inputs = Object.values(graph.edges_in[n.id] ?? []).map(edge => ({edge, node: Object.values(graph.nodes).find(n => n.id === edge.from)}));
            text += `
function fn_${n.id}(){
  ${inputs
    .map(input => `let ${input.edge.as} = ${isNodeRef(input.node) && input.node.ref === "arg" && input.node.value === '_lib' ? '_lib' : nodefn(input.node)}`)
    .join("\n")}
  return target["${argToProperties(isNodeRef(n) ? n.value : 'undefined')}"]
}

`
          } else if(noderef.ref == "extern") {
            _extern_args[n.id] = {};
            const extern = nodysseus_get(lib.data, noderef.value, lib)
            let inputs = nodeinputs(n, graph)
            const varset = []
            extern.args.map(rawa => {
              const a = rawa.includes(':') ? rawa.substring(0, rawa.indexOf(':')) : rawa;
              if(a === "__graph_value" || a === "_node") {
                _extern_args[n.id][a] = a === "__graph_value" ? !isNodeScript(n) ? n.value : undefined
                  : "_node" ? n
                  : undefined;
                varset.push(`let ${a} = _extern_args["${n.id}"]["${a}"];`)
              } else if (a === "_node_args") {
                varset.push(`
let ${a} = {
  ${inputs.map(input => 
    `${input.edge.as}: ${nodefn(input.node)}`).join(",\n")}
};`);
              } else {
                const input = inputs.find(i => i.edge.as === a);
                if(!input){
                  varset.push(`let ${a} = undefined;`)
                } else {
                  const inputNode = Object.values(graph.nodes).find(n => n.id === input.edge.from);
                  varset.push(`
let ${a} = ${nodefn(inputNode)};
`)
                }
              }
            })
            text += `
function fn_${n.id}(){
  ${varset.join("\n")}
  return (${extern.fn.toString()})(${extern.args.map(rawa => rawa.includes(':') ? rawa.substring(0, rawa.indexOf(':')) : rawa).join(", ")})
}

`
          }  else if (isNodeRef(n)) {
            const inputs = nodeinputs(n, graph);
            text += `
function fn_${n.id}() {
  ${inputs.map(input => 
    `let ${input.edge.as} = ${nodefn(input.node)};`
  ).join("\n")}
  
  ${graphToFnBody({
    __kind: "const",
    fn: noderef.out ?? "out",
    graph: noderef,
    env: runnable.env,
    lib: runnable.lib
  }, lib)}
}
            `
          } else {

            text += `function fn_${n.id}(){\nreturn ${noderef.value}}\n\n`
          }
        })


        // for now just assuming everything is an arg of the last node out
        text += `return fn_${runnable.fn}()`

      return {baseArgs, text, _extern_args};
  }).value;
}

 export const create_fn = (runnable: ConstRunnable, lib: Lib) => {
   const {baseArgs, text, _extern_args} = graphToFnBody(runnable, lib);
        const fn = new Function("fnargs", "baseArgs", "_extern_args", "import_util", "_lib", text);

        return (args: Env | Args | Record<string, unknown>) => fn(args ? isArgs(args) ? (resolve_args(args, lib, {}) as {value: any}).value : isEnv(args) ? (resolve_args(args.data, lib, {}) as {value: any}).value : args : {}, baseArgs, _extern_args, util, lib.data);
 }

export const now = (scale?: number) => performance.now() * (scale ?? 1)

export const expect = (a: any, b: any, value: string) => {
  if(a === b) return a 
  else {
    console.log('a:')
    console.log(a)
    console.log("b:")
    console.log(b);
    throw new Error(`${value}: Value a does not match value b`)
  }
}
