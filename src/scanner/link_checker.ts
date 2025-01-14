import { Effect, Option, Queue } from "effect"
import type { UnknownException } from "effect/Cause"
import type { Links, ParsingError } from "./html_parser.js"
import { findLinks } from "./html_parser.js"
import { PageCrawler } from "./page_crawler.js"
import { UrlSet } from "../utils/url_set.js"
import { UrlMap } from "../utils/url_map.js"

function extractLinks(
  url: URL
): Effect.Effect<ExtractResult, UnknownException | ParsingError, PageCrawler> {
  return Effect.gen(function*() {
    yield* Effect.logDebug(`Checking ${url}`)
    const pageCrawler = yield* PageCrawler
    const page = yield* pageCrawler.getPage(url)
    if (page.text) {
      const links = yield* findLinks(page.text, url.origin)
      return {
        statusCode: page.statusCode,
        links
      }
    } else {
      return yield* Effect.succeed({
        statusCode: page.statusCode,
        links: { internal: new UrlSet(), external: new UrlSet() }
      })
    }
  })
}

export function inspectPage(
  startUrl: URL
): Effect.Effect<UrlMap<number>, UnknownException | ParsingError, PageCrawler> {
  return Effect.gen(function*() {
    const todoQueue = yield* Queue.unbounded<URL>()
    yield* todoQueue.offer(startUrl)
    const seen = new UrlSet()
    seen.add(startUrl)
    const result = yield* Effect.all([
      worker(seen, todoQueue),
      worker(seen, todoQueue),
      worker(seen, todoQueue),
      worker(seen, todoQueue)
    ], { concurrency: "unbounded" })
    return result.reduce((acc, curr) => acc.merge(curr), new UrlMap<number>())
  })
}

function worker(seen: UrlSet, todoQueue: Queue.Queue<URL>) {
  return Effect.gen(function*() {
    const visited = new UrlMap<number>()
    let maybeLink = yield* Queue.poll(todoQueue)
    while (Option.isSome(maybeLink)) {
      const link = maybeLink.value
      const extractedLinks = yield* extractLinks(link)
      // TODO recover from UnknownException | ParsingError
      visited.set(link, extractedLinks.statusCode)
      for (const l of extractedLinks.links.internal) {
        if (!seen.has(l)) {
          seen.add(l)
          yield* todoQueue.offer(new URL(l))
        }
      }
      maybeLink = yield* Queue.poll(todoQueue)
    }
    return visited
  })
}

interface ExtractResult {
  statusCode: number
  links: Links
}
