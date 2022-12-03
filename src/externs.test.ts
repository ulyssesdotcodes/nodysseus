import {describe, expect, test} from "@jest/globals"
import {nolib} from "./nodysseus"
import { create_fn } from "./externs"

describe('create_fn', () => {
  test('parsing a single script', async () => {
    const fn = create_fn({
      fn: 'set',
      graph: {
        id: expect.getState().currentTestName,
        nodes: [
          {id: "set", ref: "script", value: "return 1 + 1"}
        ],
        edges: []
      },
      args: {}
    }, nolib)

    expect(fn()).toEqual(2);
  })

  test('using an argument', async () => {
    const fn = create_fn({
      fn: 'ret',
      graph: {
        id: expect.getState().currentTestName,
        nodes: [
          {id: "inval", ref: "arg", value: "value"},
          {id: "ret", ref: "script", value: "return 1 + inval"}
        ],
        edges: [
          {from: "inval", to: "ret", as: "inval"}
        ]
      },
      args: {}
    }, nolib)

    expect(fn({value: 2})).toEqual(3);
  })

  test('setting a value', async () => {
    const fn = create_fn({
      fn: 'setval',
      graph: {
        id: expect.getState().currentTestName,
        nodes: [
          {id: "inval", ref: "arg", value: "value"},
          {id: "setval", ref: "set", value: "x"},
          {id: "newval", value: "3"},
        ],
        edges: [
          {from: "inval", to: "setval", as: "target"},
          {from: "newval", to: "setval", as: "value"}
        ]
      },
      args: {}
    }, nolib)

    expect(fn({value: {x: 0}}).x).toEqual(3);
  })

})
