import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment, StateField, StateEffect } from "@codemirror/state"
import { language } from "@codemirror/language"
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import {UpdateNode} from "../util"

export const init_code_editor = (dispatch, {html_id}) => {
    requestAnimationFrame(() => {
        const languageConf = new Compartment()
        const autoLanguage = EditorState.transactionExtender.of(tr => {
          if(!tr.docChanged) return null;
          let docLang = document.getElementsByClassName("markdown").length > 0 ? 'markdown' : 'javascript';
          let stateLang = tr.startState.facet(language) == markdownLanguage ? 'markdown' : 'javascript';
          if(docLang === stateLang) return null;
          return {
            effects: languageConf.reconfigure(docLang === 'markdown' ? markdown() : javascript())
          }
        })
        const background = "#111";
        const highlightBackground = "#00000033";
        const code_editor_nodeid_field = StateField.define({
              create() { return "" },
              update(value, transaction) { return transaction.effects.filter(e => e.is(code_editor_nodeid))?.[0]?.value ?? value; }
            })
        const code_editor_nodeid = StateEffect.define();

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
            languageConf.of(javascript()),
            autoLanguage,
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

        dispatch(s => ({...s, code_editor, code_editor_nodeid}))
    })
}
