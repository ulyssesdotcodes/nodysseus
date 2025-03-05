import { initStore, nolib, nodysseus_get } from "./nodysseus";
import { expect, test, describe } from "@jest/globals";
import { Graph } from "./types";
import { newEnv } from "./util";
import { lokiStore } from "./store";

describe("tbd", () => {
  test("test", () => {
    expect(true).toBeTruthy();
  });
});

describe("helperfunctions", () => {
  test("get", () => {
    const obj = { a: { b: "c" } };
    const result = nodysseus_get(obj, "a.b", { __kind: "lib", data: {} });
    expect(result).toBe("c");

    const result2 = nodysseus_get(obj, "a.c", { __kind: "lib", data: {} });
    expect(result2).toBe(undefined);

    const result3 = nodysseus_get(obj, "a.c.d", { __kind: "lib", data: {} });
    expect(result3).toBe("a");
  });
});
