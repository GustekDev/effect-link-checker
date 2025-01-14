import { Context, Effect } from "effect"
import type { UnknownException } from "effect/Cause"

export interface IPageCrawler {
  getPage(url: URL): Effect.Effect<HttpResponse, UnknownException, never>
}

export class PageCrawler extends Context.Tag("PageCrawler")<PageCrawler, IPageCrawler>() {}

export const PageCrawlerLive: IPageCrawler = {
  getPage(url: URL): Effect.Effect<HttpResponse, UnknownException, never> {
    return Effect.tryPromise(async () => {
      const res = await fetch(url)
      if (res.ok) {
        const text = await res.text()
        return {
          statusCode: res.status,
          text
        }
      }
      return {
        statusCode: res.status,
        text: null
      }
    })
  }
}

export interface HttpResponse {
  statusCode: number
  text: string | null
}
