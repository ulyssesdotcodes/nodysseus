import * as ha from "hyperapp"
import { nolib, nolibLib, run } from "src/nodysseus.js"
import {  JSXIdentifierKind } from "ast-types/gen/kinds.js"
import justGet from "just-safe-get"
import justSet from "just-safe-set"
import * as acorn from "acorn"
import jsx from "acorn-jsx"
import {Node as ESTreeNode} from "estree"
import {namedTypes as n, builders as b, visit} from "ast-types"
import domTypes from "../html-dom-types.json" assert { type: "json" }

import { FunctorRunnable, isRunnable } from "src/types.js"
import { ispromise, mergeLib, newLib, wrapPromise, wrapPromiseAll } from "src/util.js"
import { hlib } from "./util.js"


const JsxParser = acorn.Parser.extend(jsx())

export const runh = el => el.d && el.p && el.c && ha.h(el.d, el.p, el.c)

export const run_h = ({dom_type, props, children, text}: {dom_type: string, props: {}, children: Array<any>, text?: string}, exclude_tags=[]) => {
  return dom_type === "text_value" 
    ? ha.text(text) 
    : ha.h(
      dom_type, 
      Object.fromEntries(Object.entries(props).map(e => [e[0], typeof e[1] === "function" ? (state, payload) => ((e[1] as Function)({event: payload}), state) : e[1]])), 
      children?.map(c => c.el ?? c).filter(c => !!c && !exclude_tags.includes(c.dom_type)).map(c => run_h(c, exclude_tags)) ?? []) 
}
