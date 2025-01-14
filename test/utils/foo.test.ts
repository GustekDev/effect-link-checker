import { describe, expect, it } from "@effect/vitest"
import { foo } from "../../src/utils/foo"
import { Effect } from "effect"

describe("Foo", () => {
  it("should pass", () => {
    Effect.gen(function* () {
      const result = yield* foo(4, 2)
      expect(result).toBe(2)
    })
  })
})
