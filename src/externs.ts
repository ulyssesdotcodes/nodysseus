import * as util from "./util"
import {nodysseus_get, resolve_args} from "./nodysseus"
import { ConstRunnable, isNodeRef, isNodeScript, Lib, RefNode, Runnable } from "./types";

 export const create_fn = (runnable: ConstRunnable, lib: Lib) => {
    const graph = util.ancestor_graph(runnable.fn, runnable.graph, lib.data);
  const graphArgs = new Set(Object.values(graph.nodes).filter<RefNode>(isNodeRef).filter(n => n.ref === "arg").map(a => a.value));

   const baseArgs = resolve_args(new Map([...graphArgs].map(a => [a, nodysseus_get(runnable.env, a, lib)])), lib, {});
   const create = ({value: baseArgs}) => {
        graph.id = runnable.fn + "-fn";
        // for(const arg of graphArgs) {
        //   baseArgs[arg] = nodysseus_get(runnable.env, arg, lib)
        // }

        let text = "";
        const _extern_args = {};

        Object.values(graph.nodes).forEach(n => {
          if(isNodeRef(n) && n.ref === "arg") {
            return;
          }
          const noderef = isNodeRef(n) ? lib.data.no.runtime.get_ref(n.ref) : n;
          if(noderef.id === "script") {
            // TODO: extract this logic from node_script
            let inputs = Object.values(graph.edges).filter(e => e.to === n.id).map(edge => ({edge, node: Object.values(graph.nodes).find(n => n.id === edge.from)}));
            text += `function fn_${n.id}(){\n${inputs.map(input => `let ${input.edge.as} = ${isNodeRef(input.node) && input.node.ref === "arg" ? `fnargs["${input.node.value}"] ?? baseArgs["${input.node.value}"]` : `fn_${input.node.id}()`};`).join("\n")}\n\n${isNodeScript(n) ? n.script : n.value}}\n\n`
          } else if(noderef.ref == "extern") {
            _extern_args[n.id] = {};
            const extern = nodysseus_get(lib, noderef.value, lib)
            let inputs = Object.values(graph.edges).filter(e => e.to === n.id).map(edge => ({edge, node: Object.values(graph.nodes).find(n => n.id === edge.from)}));
            const varset = []
            extern.args.map(a => {
              if(a === "__graph_value" || a === "_node") {
                _extern_args[n.id][a] = a === "__graph_value" ? !isNodeScript(n) ? n.value : undefined
                  : "_node" ? n
                  : undefined;
                varset.push(`let ${a} = _extern_args["${n.id}"]["${a}"];`)
              } else if (a === "_node_args") {
                varset.push(`let ${a} = {\n${inputs.map(input => `${input.edge.as}: ${isNodeRef(input.node) && input.node.ref === "arg" ? `(fnargs.${input.node.value} ?? baseArgs.${input.node.value})` : `fn_${input.edge.from}()`}`).join(",\n")}};`);
              } else {
                const input = inputs.find(i => i.edge.as === a);
                if(!input){
                  varset.push(`let ${a} = undefined;`)
                } else {
                  const inputNode = Object.values(graph.nodes).find(n => n.id === input.edge.from);
                  varset.push(`let ${a} = ${isNodeRef(inputNode) && inputNode.ref === "arg" ? `(fnargs.${input.edge.as} ?? baseArgs.${input.edge.as})` : `fn_${input.edge.from}()`};`)
                }
              }
            })
            text += `function fn_${n.id}(){\n${varset.join("\n")}\nreturn (${extern.fn.toString()})(${extern.args.join(", ")})}\n\n`
          } else if (noderef.id === "get"){
            let inputs = Object.values(graph.edges).filter(e => e.to === n.id).map(edge => ({edge, node: Object.values(graph.nodes).find(n => n.id === edge.from)}));
            text += `function fn_${n.id}(){\n${inputs.map(input => `let ${input.edge.as} = ${isNodeRef(input.node) && input.node.ref === "arg" ? input.node.value === '_lib' ? '_lib' : `(fnargs["${input.node.value}"] ?? baseArgs.${input.node.value})` : `fn_${input.node.id}()`};`).join("\n")}\n\nreturn target.${isNodeRef(n) ? n.value : 'undefined'}}\n\n`
          } else {
            text += `function fn_${n.id}(){\nreturn ${noderef.value}}\n\n`
          }
        })

        const fninputs = Object.values(graph.edges).filter(e => e.to === runnable.fn)

        // for now just assumeing everything is an arg of the last node out
        // TODO: tree walk
        text += `return fn_${runnable.fn}()`//({${[...fninputs].map(rinput => `${rinput.as}: fnargs.${graph.nodes.find(n => n.id === rinput.from).value}`).join(",")}})`
        const fn = new Function("fnargs", "baseArgs", "_extern_args", "import_util", "_lib", text);

        return (args={}) => fn(args, baseArgs, _extern_args, util, lib.data);
      }

    return util.wrapPromise(baseArgs).then(create).value
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
