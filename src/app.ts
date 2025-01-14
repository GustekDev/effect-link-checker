import { Args } from "@effect/cli"
import * as Command from "@effect/cli/Command"
import { Console, Effect, Logger, LogLevel } from "effect"
import { inspectPage } from "./scanner/link_checker.js"
import { PageCrawler, PageCrawlerLive } from "./scanner/page_crawler.js"
import { NodeContext, NodeRuntime } from "@effect/platform-node"

// Define a text argument
const url = Args.text({ name: "url" })

// Create a command that logs the provided text argument to the console
const command = Command.make("link-scanner", { url }, ({ url }) => {
  return Effect.gen(function*() {
    const result = yield* inspectPage(new URL(url))
    for (const [pageUrl, statusCode] of result) {
      yield* Console.log(`${pageUrl}: ${statusCode}`)
    }
  }).pipe(Logger.withMinimumLogLevel(LogLevel.Debug))
})

export const run = Command.run(command, {
  name: "Link Scanner CLI",
  version: "v0.0.1"
})

run(process.argv).pipe(
  Effect.provideService(PageCrawler, PageCrawlerLive),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain()
)
