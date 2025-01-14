import { describe, expect, it } from "@effect/vitest"
import { Effect, Either } from "effect"
import { findLinks } from "../../src/scanner/html_parser"
import { NodeContext } from "@effect/platform-node"

const runEffect = <E, A>(
  self: Effect.Effect<A, E, NodeContext.NodeContext>
): Promise<A> => Effect.provide(self, NodeContext.layer).pipe(Effect.runPromise)

describe("findLinks", () => {
  it("should return empty sets for empty string", () =>  Effect.gen(function* () {
      const result = yield* findLinks("", "example.com")
      expect(result.internal.size()).toBe(0)
      expect(result.external.size()).toBe(0)
  }).pipe(runEffect))

  it("should return ParsingError for invalid HTML", () => Effect.gen(function* () {
      const result = findLinks("<html>", "example.com")
      expect(Either.isLeft(result)).toBe(true)
  }).pipe(runEffect))
})
