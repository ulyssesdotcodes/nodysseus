import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment, StateField, StateEffect, RangeSet, Range, Text } from "@codemirror/state"
import { language, syntaxTree } from "@codemirror/language"
import { esLint, javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { json, jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import {linter, lintGutter} from "@codemirror/lint";
import {CreateNode, UpdateNode} from "../util.js"
import { Decoration, DecorationSet, ViewPlugin, WidgetType } from "@codemirror/view";

class ExtractInputWidget extends WidgetType {
  constructor(readonly name: string, readonly value: string | number, readonly from: number, readonly to: number, readonly dispatch: Function) { super() }

  eq(other: ExtractInputWidget){ return other.name === this.name && other.value === this.value }

  toDOM(view: EditorView): HTMLElement {
    let wrap = document.createElement("span")
    wrap.setAttribute("aria-hidden", "true")
    wrap.className = "cm-extract-input";
    let button = wrap.appendChild(document.createElement("button"))
    button.textContent = `Extract input ${this.name} = ${this.value}`;
    button.addEventListener('click', () => {
      const newText = view.state.doc.replace(this.from, this.to, Text.of([""]))
      this.dispatch(UpdateNode, {
        node: view.state.field(code_editor_nodeid_field),
        property: "value", 
        value: newText.sliceString(0, newText.length, "\n")
      })
      this.dispatch(CreateNode, {
        node: {value: this.value},
        child: view.state.field(code_editor_nodeid_field),
        child_as: this.name
       })
    })
    return wrap
  }

  ignoreEvent(event: Event): boolean {
      return false;
  }
}

const code_editor_nodeid = StateEffect.define();
const code_editor_nodeid_field = StateField.define({
      create() { return "" },
      update(value, transaction) { return transaction.effects.filter(e => e.is(code_editor_nodeid))?.[0]?.value ?? value; }
    })

export const init_code_editor = (dispatch, {html_id}) => {
    requestAnimationFrame(() => {
        const codeEditorExtensions = new Compartment()
        const background = "#111";
        const highlightBackground = "#00000033";

        const code_editor = new EditorView({extensions: [
            basicSetup, 
            EditorView.theme({
                "&": {
                    "backgroundColor": background,
                },
                ".cm-content": {
                    caretColor: "#66ccff",
                    whiteSpace: "pre-wrap",
                    width: "325px"
                },
                ".cm-gutters": {
                    backgroundColor: background,
                    outline: "1px solid #515a6b",
                },
                "&.cm-activeLine, .cm-activeLine": {
                    backgroundColor: highlightBackground,
                },
                "&.cm-focused .cm-cursor": {
                    borderLeftColor: "#fff"
                },
                "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
                  backgroundColor: "#233"
                }
            }, {dark: true}),
            codeEditorExtensions.of(javascript({jsx: true})),
            ViewPlugin.define(view => {
              const viewfn = {
                decorations: RangeSet.of<Decoration>([]),
                update: viewUpdate => {
                  const widgets = [];

                  if(viewUpdate.state.selection.ranges.length > 0) { 
                    syntaxTree(viewUpdate.state).iterate({
                      to: viewUpdate.state.selection.ranges[0].to,
                      from: viewUpdate.state.selection.ranges[0].from,
                      enter: node => {
                        if(node.name === "VariableDeclaration"){
                          const nameNode = node.node.getChild("VariableDefinition");
                          const valueNode = node.node.getChild("String", "VariableDefinition") ?? node.node.getChild("Number", "VariableDefinition") ;
                          if(nameNode && valueNode) {
                            const varName = viewUpdate.state.sliceDoc(nameNode.from, nameNode.to);
                            const varValue = viewUpdate.state.sliceDoc(valueNode.from, valueNode.to);
                            
                            widgets.push(Decoration.widget({widget: new ExtractInputWidget(varName, varValue, node.from, node.to, dispatch)}).range(node.to))
                          }
                        }
                      }
                    });
                  }
                  const decset = Decoration.set(widgets)
                  viewfn.decorations = decset;
                  return decset
                }
              }

              return viewfn;
        }, {
                decorations: v => v.decorations
              }),
            code_editor_nodeid_field,
            EditorView.domEventHandlers({
                "blur": () => {
                  dispatch(UpdateNode, {
                    node: code_editor.state.field(code_editor_nodeid_field),
                    property: "value", 
                    value: code_editor.state.doc.sliceString(0, code_editor.state.doc.length, "\n")
                  })
                }
            })
        ], parent: document.getElementById(`${html_id}-code-editor`)});

        dispatch(s => ({...s, code_editor, code_editor_nodeid, codeEditorExtensions}))
    })
}
