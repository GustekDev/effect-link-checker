import { describe, expect, it } from "@effect/vitest"
import { UrlMap } from "../../src/utils/url_map"
import { UrlSet } from "../../src/utils/url_set"

describe("UrlSet", () => {
  it("should store different instance of URL for the same url as the same key", () => {
    const url = "https://www.google.com"
    const url1 = new URL(url)
    const url2 = new URL(url)
    const set = new UrlSet()
    set.add(url1)
    set.add(url2)
    expect(set.has(url1)).toBe(true)
    expect(set.has(url2)).toBe(true)
    expect(set.size()).toBe(1)
  })

  it("should store URLs with and without ending / as the same key", () => {
    const url1 = new URL("https://www.google.com")
    const url2 = new URL("https://www.google.com/")
    const set = new UrlSet()
    set.add(url1)
    set.add(url2)
    expect(set.has(url1)).toBe(true)
    expect(set.has(url2)).toBe(true)
    expect(set.size()).toBe(1)
  })

  it("should store different urls as different keys", () => {
    const url1 = new URL("https://www.google.com/path1")
    const url2 = new URL("https://www.google.com/path2")
    const set = new UrlSet()
    set.add(url1)
    set.add(url2)
    expect(set.has(url1)).toBe(true)
    expect(set.has(url2)).toBe(true)
    expect(set.size()).toBe(2)
  })
})
