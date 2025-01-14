export class UrlSet {
  private data = new Map<string, URL>()

  add(url: URL) {
    this.data.set(url.toString(), url)
  }

  has(url: URL): boolean {
    return this.data.has(url.toString())
  }

  size(): number {
    return this.data.size
  }

  [Symbol.iterator](): Iterator<URL> {
    let index = 0
    const items = [...this.data.values()]

    return {
      next(): IteratorResult<URL> {
        if (index < items.length) {
          return { value: items[index++], done: false }
        } else {
          return { value: undefined, done: true }
        }
      }
    }
  }
}
