import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { Endpoint } from "../shared/dsl";
import * as R from "fp-ts/Record";
import * as J from "fp-ts/Json";
import * as TE from "fp-ts/TaskEither";
import { identity, pipe } from "fp-ts/function";
import { config } from "./config";

export type Fetch<I, O> = (input: I) => TE.TaskEither<any, O>;

const fetchAPIEndpoint = <I, O>(
  url: string, inputCodec: t.Type<I, unknown>, outputCodec: t.Type<O, unknown>
): Fetch<I, O> => input => {
  return pipe(
    inputCodec.decode(input),
    E.chain(x => J.stringify(inputCodec.encode(x))),
    TE.fromEither,
    TE.chain(
      TE.tryCatchK(body => pipe(
        fetch(`${config.apiEndpoint}${url}`, {
          method: "POST",
          headers: [["Content-Type", "application/json"]],
          body
        }).then(res => {
          if (res.status !== 200) throw res;
          return res;
        }).then(res => res.json()),
      ), identity)
    ),
    TE.chainEitherKW(outputCodec.decode),
  )
}

export const getClient = <A extends Record<string, Endpoint<any, any>>>(api: A): {
  [K in keyof A]: Fetch<t.TypeOf<A[K]["input"]>, t.TypeOf<A[K]["output"]>>;
} => {
  return R.record.map(api, endpoint => fetchAPIEndpoint(
    endpoint.path,
    endpoint.input,
    endpoint.output
  )) as any;
}
