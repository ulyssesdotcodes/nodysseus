import {describe, expect, test} from "@jest/globals"
import {initStore, nolib, run} from "./nodysseus"
import { create_fn } from "./externs"
import { newEnv, newLib } from "./util"
import {lokiStore} from "./store"

import testTapBeat from "../scripts/testtapbeat.json"

describe("create_fn", () => {
  test("parsing a single script", async () => {
    initStore(lokiStore())

    const graph = {
      __kind: "const",
      fn: "set",
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          set: {id: "set", ref: "@js.script", value: "return 1 + 1"}
        },
        edges: {},
        edges_in: {}
      }, 
      env: newEnv(new Map()),
      lib: newLib(nolib)
    }

    graph.graph.edges_in = Object.values(graph.graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})

    const fn = create_fn(graph, newLib(nolib))


    expect((fn as Function)()).toEqual(2)
  })

  test("using an argument", async () => {
    initStore(lokiStore())

    const graph = {
      __kind: "const",
      fn: "ret",
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          inval: {id: "inval", ref: "arg", value: "value"},
          ret: {id: "ret", ref: "@js.script", value: "return 1 + inval"}
        },
        edges: {
          inval: {from: "inval", to: "ret", as: "inval"}
        },
        edges_in: {}
      },
      env: newEnv(new Map()),
      lib: newLib(nolib)
    }
    graph.graph.edges_in = Object.values(graph.graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
    const fn = create_fn(graph, newLib(nolib))

    // fn.edges_in = Object.values(fn.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})

    expect((fn as Function)({value: 2})).toEqual(3)
  })

  test("setting a value", async () => {
    initStore(lokiStore())

    const graph = {
      __kind: "const",
      fn: "setval",
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          inval: {id: "inval", ref: "arg", value: "value"},
          setval: {id: "setval", ref: "@data.set", value: "x"},
          newval: {id: "newval", value: "3"},
        },
        edges: {
          inval: {from: "inval", to: "setval", as: "target"},
          newval: {from: "newval", to: "setval", as: "value"}
        },
        edges_in: {}
      },
      env: newEnv(new Map()),
      lib: newLib(nolib)
    }

    graph.graph.edges_in = Object.values(graph.graph.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})
    const fn = create_fn(graph, newLib(nolib))

    // fn.edges_in = Object.values(fn.edges).reduce((acc, edge) => ({...acc, [edge.to]: {...(acc[edge.to] ?? {}), [edge.from]: edge}}), {})

    expect((fn as Function)({value: {x: 0}}).x).toEqual(3)
  })

  test("snapshot", async () => {
    initStore(lokiStore())

    expect(run({graph: testTapBeat, fn: "out"})).toMatchSnapshot()
  })

})
