import { Either, Option } from "effect";


export function foo(a: number, b: number): Option.Option<number> {
  if (b === 0) {
    return Option.none()
  } else {
    return Option.some(a / b)
  }
}