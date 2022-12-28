import {describe, expect, test} from "@jest/globals"
import {initStore, nolib} from "./nodysseus"
import { create_fn } from "./externs"

describe('create_fn', () => {
  test('parsing a single script', async () => {
    initStore()

    const fn = create_fn({
      fn: 'set',
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          set: {id: "set", ref: "script", value: "return 1 + 1"}
        },
        edges: {}
      },
      args: {}
    }, nolib)

    expect(fn()).toEqual(2);
  })

  test('using an argument', async () => {
    initStore()

    const fn = create_fn({
      fn: 'ret',
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          inval: {id: "inval", ref: "arg", value: "value"},
          ret: {id: "ret", ref: "script", value: "return 1 + inval"}
        },
        edges: {
          inval: {from: "inval", to: "ret", as: "inval"}
        }
      },
      args: {}
    }, nolib)

    expect(fn({value: 2})).toEqual(3);
  })

  test('setting a value', async () => {
    initStore()

    const fn = create_fn({
      fn: 'setval',
      graph: {
        id: expect.getState().currentTestName,
        nodes: {
          inval: {id: "inval", ref: "arg", value: "value"},
          setval: {id: "setval", ref: "set", value: "x"},
          newval: {id: "newval", value: "3"},
        },
        edges: {
          inval: {from: "inval", to: "setval", as: "target"},
          newval: {from: "newval", to: "setval", as: "value"}
        }
      },
      args: {}
    }, nolib)

    expect(fn({value: {x: 0}}).x).toEqual(3);
  })

})
