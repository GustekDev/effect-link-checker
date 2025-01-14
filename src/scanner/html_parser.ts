import { Console, Either } from "effect"
import { parse, valid } from "node-html-parser"
import { UrlSet } from "../utils/url_set"

export function findLinks(html: string, baseUrl: string): Either.Either<Links, ParsingError> {
  if (!valid(html, { })) {
    return Either.left(new ParsingError("Invalid HTML"))
  }
  const root = parse(html)
  const links = root.getElementsByTagName("a")
  const hrefs: Array<string> = links
    .map((link) => link.getAttribute("href"))
    .filter((href) => href !== undefined)

  const internal = new UrlSet()
  const external = new UrlSet()
  for (const href of hrefs) {
    if (href.startsWith(baseUrl)) {
      internal.add(new URL(href))
    } else if (href.startsWith("//")) {
      external.add(new URL(href))
    } else if (href.startsWith("/")) {
      internal.add(new URL(`${baseUrl}${href}`))
    } else if (href.startsWith("http://") || href.startsWith("https://")) {
      external.add(new URL(href))
    } else {
      // TODO support for external without protocol and for relative path not starting with /
      Console.warn(`Unhandled href: ${href}`)
    }
  }
  return Either.right({ internal, external })
}

export interface Links {
  internal: UrlSet
  external: UrlSet
}

export class ParsingError {
  message: string
  constructor(message: string) {
    this.message = message
  }
}
