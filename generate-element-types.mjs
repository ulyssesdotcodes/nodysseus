import {listAll} from "@webref/elements";
import {parseAll as idlParseAll} from '@webref/idl';
import {listAll as  listAllCss} from "@webref/css";

const ALLOWED_TYPES = ["DOMString", "SVGAnimatedLength", "long", "unsigned long", "unsigned short", "double", "float", "SVGNumber", "SVGLength", "SVGAnimatedLength", "SVGAngle", "SVGAnimatedAngle", "SVGAnimatedNumber", "EventHandler"]

const getIdlType = (m) => !m ? null : typeof m.idlType === "string" ? m.idlType : getIdlType(m.idlType);
const getMembers = (el) => el?.members?.concat(el.inheritance && asts[el.inheritance] ? getMembers(asts[el.inheritance]) : []) ?? []

const idls = await idlParseAll();
const asts = Object.fromEntries(idls["html"].concat(idls["SVG"]).filter(x => x).map(e => [e.name, e]));
const domasts = Object.fromEntries(idls["dom"].map(e => [e.name, e]));

const cssIdls = await listAllCss();

const defaultHTMLAttrs = [...new Set(asts["HTMLElement"].members
  .concat(domasts["Element"].members)
  .concat(asts["GlobalEventHandlers"].members)
  .filter(m => ALLOWED_TYPES.includes(getIdlType(m)))
  .filter(m => m.name && !m.name?.startsWith("get") && !m.name?.startsWith("set"))
  .map(m => getIdlType(m) === "EventHandler" ? [m.name, {type: "@flow.runnable", runnableParameters: ["event"]}] : m.name)
).values()];
const defaultSVGAttrs = [...new Set(asts["SVGElement"].members.concat(domasts["Element"].members).filter(m => ALLOWED_TYPES.includes(getIdlType(m))).map(m => m.name).filter(n => n && !n?.startsWith("get") && !n?.startsWith("set"))).values()];
const output = {defaults: {html: defaultHTMLAttrs, svg: defaultSVGAttrs, css: Object.values(cssIdls).flatMap(e => e.properties.map(p => p.name)).filter(n => typeof n === "string").sort((a, b) => a.startsWith("-") === b.startsWith("-") ? a.localeCompare(b) : a.startsWith("-") ? 1 : -1)}};
const types = new Set();
await listAll().then(all => {
  // for (const [shortname, data] of Object.entries(all)) {
    // console.log(data.spec.title);
    for (const el of all.html.elements) {
      if (el.interface && asts[el.interface]) {
        // console.log(`- ${el.name} implements ${el.interface}`);
        output[el.name] = {
          spec: "html",
          attrs: [...new Set((asts[el.interface].members ?? [])
            .filter(m => m.type === "attribute" && ALLOWED_TYPES.includes(getIdlType(m)))
            .map(m => m.name))]
        }
      }
      else {
        // console.log(`- ${el.name} does not implement an interface`);
      }
    }

    for (const el of all.SVG11.elements) {
      if (el.interface && asts[el.interface]) {
        getMembers(asts[el.interface]).forEach(m => types.add(getIdlType(m)))
        // console.log(`- ${el.name} implements ${el.interface}`);
        output[el.name] = {
          spec: "svg",
          attrs: getMembers(asts[el.interface])
            .filter(m => (m.type === "attribute" || m.type === "attribute-type") && ALLOWED_TYPES.includes(getIdlType(m)) && m.name.substring(0, 1) === m.name.substring(0, 1).toLowerCase())
            .map(m => m.name)
        }
      }
      else {
        // console.log(`- ${el.name} does not implement an interface`);
      }
    }
  // }
})

// console.log(JSON.stringify(output))
// console.log(JSON.stringify([...types]))
// console.log(JSON.stringify(asts["SVGRectElement"], null, 2))
// console.log(JSON.stringify(asts["SVGGraphicsElement"]))

export const elementTypes = output;
