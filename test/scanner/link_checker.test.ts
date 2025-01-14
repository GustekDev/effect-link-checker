import { describe, expect, it } from "@effect/vitest"
import { Duration, Effect, Fiber, Ref, TestClock, TestContext } from "effect"
import { NodeContext } from "@effect/platform-node"
import { inspectPage } from "../../src/scanner/link_checker"
import { IPageCrawler, PageCrawler, PageCrawlerLive, HttpResponse } from "../../src/scanner/page_crawler"
import { UnknownException } from "effect/Cause"
import { UrlMap } from "../../src/utils/url_map"
import { cons } from "effect/List"

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

  it("should continue work on other workers when there is slow page", () => Effect.gen(function* () {
    const fiber = yield* inspectPage(new URL("https://www.example.com"))
      .pipe(
        Effect.fork
      )
    const beforeReqCount = yield* Ref.get(yield* PageCrawlerTestWithSlowPage.requestCounter)
    expect(beforeReqCount).toBe(9)
    yield* TestClock.adjust(Duration.seconds(61))
    const afterReqCount = yield* Ref.get(yield* PageCrawlerTestWithSlowPage.requestCounter)
    expect(afterReqCount).toBe(10)
    console.log(beforeReqCount, afterReqCount)

    const result = yield* Fiber.join(fiber)
    expect(result.size()).toBe(10)
    expect(result.get(new URL("https://www.example.com"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/1"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/2"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/3"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/4"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/5"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/6"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/7"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/8"))).toBe(200)
    expect(result.get(new URL("https://www.example.com/slow_page"))).toBe(200)
  }).pipe(
    Effect.provideService(PageCrawler, PageCrawlerTestWithSlowPage),
    Effect.provide(TestContext.TestContext),
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


// const PageCrawlerTestWithSlowPage: IPageCrawler & { requestCounter: Effect.Effect<Ref.Ref<number>> } = {
//   requestCounter: Ref.make(0),
//   getPage(url: URL): Effect.Effect<HttpResponse, UnknownException, never> {  
//     const mockResponses = new UrlMap<HttpResponse>()
//     mockResponses.set(new URL("https://www.example.com"), {statusCode: 200, text: exampleHomePage})
//     mockResponses.set(new URL("https://www.example.com/1"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/2"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/3"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/4"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/5"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/6"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/7"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/8"), {statusCode: 200, text: exampleEmptyPage})
//     mockResponses.set(new URL("https://www.example.com/slow_page"), {statusCode: 200, text: exampleEmptyPage})
//     return Effect.gen(function*() {
//       if (url.toString().includes("slow_page")) {
//         yield* Effect.sleep(Duration.minutes(1))
//       }
//       yield* Ref.update(requestCounter, (c) => c + 1)
//       return yield* Effect.tryPromise(async () => Promise.resolve(mockResponses.get(url)!)) // ! ok here, if test fail becasue of that then it was a bad test
//     })
//   }
// }

function buildPageCrawlerTestWithSlowPage(): IPageCrawler & { requestCounter: Effect.Effect<Ref.Ref<number>> } {
  const requestCounter = Ref.make(0)
  return {
    requestCounter,
    getPage(url: URL): Effect.Effect<HttpResponse, UnknownException, never> {  
      const mockResponses = new UrlMap<HttpResponse>()
      mockResponses.set(new URL("https://www.example.com"), {statusCode: 200, text: exampleHomePage})
      mockResponses.set(new URL("https://www.example.com/1"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/2"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/3"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/4"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/5"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/6"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/7"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/8"), {statusCode: 200, text: exampleEmptyPage})
      mockResponses.set(new URL("https://www.example.com/slow_page"), {statusCode: 200, text: exampleEmptyPage})
      return Effect.gen(function*() {
        if (url.toString().includes("slow_page")) {
          yield* Effect.sleep(Duration.minutes(1))
        }
        yield* Ref.update(yield* requestCounter, (c) => c + 1)
        return yield* Effect.tryPromise(async () => Promise.resolve(mockResponses.get(url)!)) // ! ok here, if test fail becasue of that then it was a bad test
      })
    }
  }
}
const PageCrawlerTestWithSlowPage = buildPageCrawlerTestWithSlowPage()

const exampleHomePage = `<html><head><title>Test Page</title></head><body>
<a href="https://www.example.com/slow_page">Slow page</a>
<a href="https://www.example.com/1">1 page</a>
<a href="https://www.example.com/2">2 page</a>
<a href="https://www.example.com/3">3 page</a>
<a href="https://www.example.com/4">4 page</a>
<a href="https://www.example.com/5">5 page</a>
<a href="https://www.example.com/6">6 page</a>
<a href="https://www.example.com/7">7 page</a>
<a href="https://www.example.com/8">8 page</a>
</body></html>`

const exampleEmptyPage = '<html></html>'