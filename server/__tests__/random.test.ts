import { deepStrictEqual } from "assert";
import fc from "fast-check";
import { pipe } from "fp-ts/lib/function";
import * as S from "fp-ts/State";
import * as E from "fp-ts/Either";
import { UUID } from "io-ts-types";
import { random, randomInRange, randomIn, char, chunk, uuid } from "../random";


test("random", () => {
  deepStrictEqual(random(1), [2811915801, 2811915801]);
})

test("randomInRange", () => {
  const seed1 = 1;
  const [r1, seed2] = randomInRange(0, 100)(seed1);
  const [r2, seed3] = randomInRange(0, 100)(seed2);

  deepStrictEqual(seed2, 2811915801);
  deepStrictEqual(seed3, 2461393960);
  deepStrictEqual([r1, r2], [65, 70]);
})

test("randomIn", () => {
  const xs = "abcdef0123456789".split("");
  const seed = 1;
  deepStrictEqual(randomIn(xs)(seed), ["3", 2811915801]);
})

test("char", () => {
  const seed = 1;
  deepStrictEqual(char(seed), ["3", 2811915801])
})

test("chunk", () => {
  const seed = 5;
  deepStrictEqual(chunk(4)(seed), [ '53a4', 2497599633 ]);
});

test("uuid", () => {
  const seed = 5;
  deepStrictEqual(
    uuid(seed),
    ["53a424f4-e5ef-38a4-645a-a8a214300f03", 3047799883]
  )
})

test("decode uuid", () => {
  const seed = new Date("December 17, 1995 03:24:00").getTime();

  deepStrictEqual(
    pipe(
      uuid,
      S.evaluate(seed),
      UUID.decode
    ),
    E.right("05efefd7-6bad-d48c-786a-f1c066305ccf")
  )
})

test("uuid property", () => {
  fc.assert(fc.property(fc.nat(), (seed) => pipe(
    uuid,
    S.evaluate(seed),
    UUID.decode,
    E.isRight,
  )))
})
