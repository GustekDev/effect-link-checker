import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { NodeContext } from "@effect/platform-node"
import { inspectPage } from "../../src/scanner/link_checker"
import { IPageCrawler, PageCrawler, PageCrawlerLive, HttpResponse } from "../../src/scanner/page_crawler"
import { UnknownException } from "effect/Cause"
import { UrlMap } from "../../src/utils/url_map"

const runEffect = <E, A>(
  self: Effect.Effect<A, E, NodeContext.NodeContext>
): Promise<A> => Effect.provide(self, NodeContext.layer).pipe(Effect.runPromise)

describe("inspectPage", () => {
  it("should return 1 successful link for example.com", () =>  Effect.gen(function* () {
      const result = yield* inspectPage(new URL("http://example.com"))
      expect(result.size()).toBe(1)
      expect(result.get(new URL("http://example.com"))).toBe(200)
  }).pipe(
    Effect.provideService(PageCrawler, PageCrawlerLive),
    runEffect
  ))

  it("should visit all pages at mock example.com", () =>  Effect.gen(function* () {
    const result = yield* inspectPage(new URL("https://www.example.com"))
    expect(result.size()).toBe(2)
    expect(result.get(new URL("https://www.example.com"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/404"))).toBe(404)
}).pipe(
  Effect.provideService(PageCrawler, PageCrawlerTest),
  runEffect
))
})


export const PageCrawlerTest: IPageCrawler = {
  getPage(url: URL): Effect.Effect<HttpResponse, UnknownException, never> {  
    const mockResponses = new UrlMap<HttpResponse>()
    mockResponses.set(new URL("https://www.example.com"), {statusCode: 200, text: examplePage})
    mockResponses.set(new URL("https://www.example.com/404"), {statusCode: 404, text: null})
    return Effect.tryPromise(async () => Promise.resolve(mockResponses.get(url)!)) // ! ok here, if test fail becasue of that then it was a bad test
  }
}

const examplePage = `<html><head><title>Test Page</title></head><body>
<a href="https://www.example.com/404">404 page</a>
</body></html>`