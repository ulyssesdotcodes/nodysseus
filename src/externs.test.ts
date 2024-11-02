import {describe, expect, test} from "@jest/globals"
import {initStore, nolib, nolibLib } from "./nodysseus"
import { create_fn } from "./externs"
import { newEnv, newLib } from "./util"
import {lokiStore} from "./store"
import {NodysseusRuntime} from "./dependency-tree/dependency-tree"

import testTapBeat from "../scripts/testtapbeat.json";


describe("create_fn", () => {
  test("empty", () => expect(true).toBeTruthy())


})
