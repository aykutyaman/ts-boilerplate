import { pipe } from "fp-ts/function";
import * as S from "fp-ts/State";
import * as Ap from "fp-ts/Apply";
import * as A from "fp-ts/Array";

type Seed = number;

export type Random<A> = S.State<Seed, A>;

export const random: S.State<Seed, Seed> = seed => {
  const nextSeed = (1839567234 * seed + 972348567) % 8239451023;
  return [nextSeed, nextSeed];
}

export const randomInRange: (max: number, min: number) => Random<number> =
  (max, min) => pipe(
    random,
    S.map(x => min + Math.floor((x / 8239451023) * (max - min)))
  )

export const randomIn = <T>(xs: T[]): S.State<Seed, T> => pipe(
  randomInRange(0, xs.length - 1),
  S.map(i => xs[i]),
)

const CHARS = "abcdef0123456789".split("");

export const char = randomIn(CHARS);

export const chunk = (n: number): S.State<Seed, string> => pipe(
  A.sequence(S.Applicative)(A.replicate(n, char)),
  S.map(ss => ss.join(''))
)

export const uuid = pipe(
  Ap.sequenceT(S.Applicative)(chunk(8), chunk(4), chunk(4), chunk(4), chunk(12)),
  S.map(ss => ss.join('-'))
)
