import { run } from "./nodysseus"

test('returns a single value', () => {
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
  expect(run({graph, fn: "out"})).toEqual(val)
})
