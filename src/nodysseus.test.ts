import { run } from "./nodysseus"
import {expect, test} from "@jest/globals"

test('returning a single value', () => {
  const val = {A: "x"};
  const graph = {
    id: "test",
    nodes: [
      {id: "value", value: JSON.stringify(val)},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "value", to: "out", as: "value"}
    ]
  }
  
  expect(run({node: {graph, fn: "out", args: {}}, args: {}})).toEqual(val)
})

test('caching', () => {
  const graph = {
    id: "test2",
    nodes: [
      {id: "st", ref: "cache"},
      {id: "val", ref: "arg", value: "val"},
      {id: "out", ref: "return"}
    ],
    edges: [
      {from: "val", to: "st", as: "value"},
      {from: "st", to: "out", as: "value"},
    ]
  }
  const a = run({node: {graph, fn: "out", args: {}}, args: {val: {a: 'A'}}});
  const b = run({node: {graph, fn: "out", args: {}}, args: {val: {b: 'B'}}});
  expect(a).toBe(b)
})
