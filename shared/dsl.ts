import * as t from "io-ts";

export interface Endpoint<I,O> {
  path: string;
  input: t.Type<I, unknown>;
  output: t.Type<O, unknown>;
}

export const Endpoint = <I,O>(
  path: string, input: t.Type<I, unknown>, output: t.Type<O, unknown>
): Endpoint<I,O> => ({ path, input, output })
