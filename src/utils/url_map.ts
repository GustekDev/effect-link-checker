export class UrlMap<T> {
  private data = new Map<string, T>()

  set(key: URL, value: T) {
    this.data.set(key.toString(), value)
  }

  get(key: URL): T | undefined {
    return this.data.get(key.toString())
  }

  has(key: URL): boolean {
    return this.data.has(key.toString())
  }

  size(): number {
    return this.data.size
  }

  merge(other: UrlMap<T>): UrlMap<T> {
    const newMap = new UrlMap<T>()
    for (const [url, value] of this) {
      newMap.set(url, value)
    }
    for (const [url, value] of other) {
      newMap.set(url, value)
    }
    return newMap
  }

  [Symbol.iterator](): Iterator<[URL, T]> {
    let index = 0
    const items = [...this.data.entries()]

    return {
      next(): IteratorResult<[URL, T]> {
        if (index < items.length) {
          const [urlStr, entry] = items[index++]
          return { value: [new URL(urlStr), entry], done: false }
        } else {
          return { value: undefined, done: true }
        }
      }
    }
  }
}
