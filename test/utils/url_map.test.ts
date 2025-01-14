import { describe, expect, it } from "@effect/vitest"
import { UrlMap } from "../../src/utils/url_map"

describe("UrlMap", () => {
  it("should store different instance of URL for the same url as the same key", () => {
    const url = "https://www.google.com"
    const url1 = new URL(url)
    const url2 = new URL(url)
    const map = new UrlMap<number>()
    map.set(url1, 1)
    map.set(url2, 2)
    expect(map.get(url1)).toBe(2)
    expect(map.size()).toBe(1)
  })

  it("should store URLs with and without ending / as the same key", () => {
    const url1 = new URL("https://www.google.com")
    const url2 = new URL("https://www.google.com/")
    const map = new UrlMap<number>()
    map.set(url1, 1)
    map.set(url2, 2)
    expect(map.get(url1)).toBe(2)
    expect(map.size()).toBe(1)
  })

  it("should store different urls as different keys", () => {
    const url1 = new URL("https://www.google.com/path1")
    const url2 = new URL("https://www.google.com/path2")
    const map = new UrlMap<number>()
    map.set(url1, 1)
    map.set(url2, 2)
    expect(map.get(url1)).toBe(1)
    expect(map.get(url2)).toBe(2)
    expect(map.size()).toBe(2)
  })
})
