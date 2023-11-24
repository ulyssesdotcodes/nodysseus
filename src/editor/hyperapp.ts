import * as ha from "hyperapp"
import { nolib, nolibLib, run } from "src/nodysseus.js"
import {  JSXIdentifierKind } from "ast-types/gen/kinds.js"
import justGet from "just-safe-get"
import justSet from "just-safe-set"
import * as acorn from "acorn"
import jsx from "acorn-jsx"
import {Node as ESTreeNode} from "estree"
import {namedTypes as n, builders as b, visit} from "ast-types"
import domTypes from "../html-dom-types.json"

import { FunctorRunnable, isRunnable } from "src/types.js"
import { ispromise, mergeLib, newLib, wrapPromise, wrapPromiseAll } from "src/util.js"
import { createElement } from "inferno-create-element"


const JsxParser = acorn.Parser.extend(jsx())

export const runh = el => el.d && el.p && el.c && ha.h(el.d, el.p, el.c)

// export const run_h = ({dom_type, props, children, text}, exclude_tags=[]) => {
//   return dom_type === "text_value" 
//     ? ha.text(text) 
//     : ha.h(
//       dom_type, 
//       Object.fromEntries(Object.entries((console.log("props", props), props)).map(e => [e[0], typeof (console.log("fn?", e[1]), e[1]) === "function" ? (state, payload) => ((e[1] as Function)({state, payload}), state) : e[1]])), 
//       children?.map(c => c.el ?? c)
//         .filter(c => !!c && !exclude_tags.includes(c.dom_type))
//         .map(c => run_h(c, exclude_tags)) ?? []) 
// }

export const run_h = ({dom_type, props, children, text}: {dom_type: string, props: {}, children: Array<any>, text?: string}, exclude_tags=[]) => {
  return dom_type === "text_value" 
    ? ha.text(text) 
    : ha.h(
      dom_type, 
      Object.fromEntries(Object.entries(props).map(e => [e[0], typeof e[1] === "function" ? (state, payload) => ((e[1] as Function)({event: payload}), state) : e[1]])), 
      children?.map(c => c.el ?? c).filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}

export const infernoView = ({dom_type, props, children, text}: {dom_type: string, props: {}, children: Array<any>, text?: string}) => 
  dom_type === "text_value"
  ? createElement("span", null, text)
  : createElement(dom_type, (console.log("props", props), props), children?.map(c => c.el ?? c).filter(c => !!c).map(c => infernoView(c)) ?? [])



export const middleware = dispatch => (ha_action, ha_payload) => {
  const is_action_array_payload = Array.isArray(ha_action) 
        && ha_action.length === 2
        && (typeof ha_action[0] === "function" 
                || (isRunnable(ha_action[0])))

  const is_action_obj_payload = isRunnable(ha_action)
  const action = is_action_array_payload ? ha_action[0] : ha_action
  const payload = is_action_array_payload ? ha_action[1] : is_action_obj_payload ? {event: ha_payload} : ha_payload

  return typeof action === "object" && isRunnable(ha_action)
    ? dispatch((state, payload) => {
      try {
        const result = action.stateonly 
          ? hlib.data.run_runnable(action, state)
          : hlib.data.run_runnable(action, {state, ...payload})

        return state

        if(!result) {
          return state
        }

        const effects = (result.effects ?? []).filter(e => e).map(e => {
          if(isRunnable(e)) {
            const effect_fn = hlib.data.run_runnable(e)
            // Object.defineProperty(effect_fn, 'name', {value: e.fn, writable: false})
            return effect_fn
          }
          return e
        })//.map(fx => ispromise(fx) ? fx.catch(e => dispatch(s => [{...s, error: e}])) : fx);

        if (ispromise(result)) {
          // TODO: handle promises properly
          return state
        }

        return result.hasOwnProperty("state")
          ? effects.length > 0 ? [result.state, ...effects] : result.state
          : result.hasOwnProperty("action") && result.hasOwnProperty("payload") 
            ? [result.action, result.payload]
            : state
      } catch(e) {
        return {...state, error: e}
      }
    }, payload)
    : dispatch(action, payload)
}

export const hlib = mergeLib(newLib({
  ha: { 
    middleware, 
    h: {
      args: ["dom_type", "props", "children", "memo"], 
      fn: (dom_type, props, children, usememo) => usememo ? ha.memo(runh, {d: dom_type, p: props, c: children}) : runh({d: dom_type, p: props, c: children})}, 
    app: ha.app, 
    text: {args: ["text"], fn: ha.text}
  },
  extern: {
    jsx: {
      outputs: {
        metadata: true
      },
      args: ["jsx", "__graph_value", "_node_args", "_output"],
      fn: (jsx: string, graphvalue: string, _node_args: Record<string, unknown>, _output: string) => {
        const nodes = JsxParser.parse(jsx ?? graphvalue, {ecmaVersion: "latest"}) as ESTreeNode

        const parameters = {}

        if(_output === "metadata") {
          visit(nodes, {
            visitJSXIdentifier(path) {
              if(!Object.hasOwn(domTypes, path.node.name)) {
                parameters[path.node.name] = "@flow.runnable"
              }
              return false
            },
            visitIdentifier(path) {
              parameters[path.node.name] = "any"
              return false
            }
          })
          return {parameters}
        }

        const outputPath = []
        const output = {}


        const runnableEls: Record<string, FunctorRunnable> = {}

        visit(nodes, {
          visitLiteral(path) {
            justSet(output, outputPath,  path.node.value)
            outputPath.pop()
            return false
          },
          visitJSXIdentifier(path) {
            if(path.name === "name" && path.parentPath.parentPath.name === "attributes") {
              outputPath.push(path.node.name)
            }
            this.traverse(path)
          },
          visitIdentifier(path) {
            const argval = _node_args[path.node.name]
            const propsIdx = outputPath.lastIndexOf("props")
            const childrenIdx = outputPath.lastIndexOf("children")
            justSet(output, outputPath, !argval ? argval : Array.isArray(argval) ? [...argval] : typeof argval === "object" ? {...argval} : childrenIdx > propsIdx ? {dom_type: "text_value", text: `${argval}`} : argval)
            outputPath.pop()
            return false
          },
          visitJSXExpressionContainer(path) {
            if(path.parentPath.name === "children") {
              if(path.name === 0) {
                outputPath.push("children")
              }

              outputPath.push(path.name)
            }
            this.traverse(path)
            if(path.parentPath.name === "children") {
              // popped by the identifier
              //console.log("jsxexpression popped idx", outputPath.pop());
              if(path.name === path.parent.node.children.length - 1) {
                outputPath.pop()
              }
            }
          },
          visitJSXOpeningElement(path) {
            outputPath.push("props"),
            this.traverse(path)
            outputPath.pop()
          },
          visitJSXAttribute(path) {
            this.traverse(path)
            if(path.node.name.name === "style") {
              const attrPath = outputPath.concat([path.node.name.name])
              const styleString = justGet(output, attrPath)
              justSet(output, attrPath, Object.fromEntries(styleString.split(";").map(v => v.split(":").map(v => v.trim()))))
            }
          },
          visitJSXElement(path) {
            const node = path.node
            if(path.parentPath.name === "children") {
              if(path.name === 0) {
                outputPath.push("children")
              }

              outputPath.push(path.name)
            }

            const nodeName = (node.openingElement.name as JSXIdentifierKind).name

            justSet(output, outputPath, {})

            if(Object.hasOwn(_node_args, nodeName)) {
              runnableEls[outputPath.join(".")] = _node_args[nodeName] as FunctorRunnable
            } else {
              justSet(output, outputPath.join(".") + ".dom_type", nodeName)
            }

            const outputNode = justGet(output, outputPath)
            outputNode.props = {}
            outputNode.children = []
            this.traverse(path)
            if(path.parentPath.name === "children") {
              outputPath.pop()
              if(path.name === path.parent.node.children.length - 1) {
                outputPath.pop()
              }
            }
          },
          visitJSXText(path) {
            if(path.parentPath.name === "children" && path.name === 0) {
              outputPath.push("children")
            }
            const node = path.node
            justSet(output, outputPath.join(".") + `.${path.name}`, {dom_type: "text_value", text: node.raw})
            if(path.parentPath.name === "children") {
              if(path.name === path.parent.node.children.length - 1) {
                outputPath.pop()
              }
            }
            return false
          }
        })

        return wrapPromiseAll(Object.entries(runnableEls).map(e => wrapPromise(nolib.no.runtime.run(e[1], justGet(output, e[0]).props)).then(el => el ? justSet(output, e[0], el) : justSet(output, e[0] + ".dom_type", "div"))))
          .then(() => output)
          .value
      }
    }
  },
  run_runnable: (runnable, args?, options?) => run(runnable, args, options),
}), nolibLib)
