import { identity, pipe } from "fp-ts/function";
import * as NEA from "fp-ts/NonEmptyArray";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as J from "fp-ts/Json";
import { config } from "./config";

export type FetchConfig = {
  url: NEA.NonEmptyArray<string>;
} & (
  | { method: "GET"; params?: URLSearchParams} | { method: "DELETE" } | { method: "POST"; body?: unknown }
)

export const fetchAPI = (fetchConfig: FetchConfig): TE.TaskEither<unknown, unknown> => {
  const url = [config.apiEndpoint as string].concat(fetchConfig.url.map(x => x.trim())).join("/");

  const body = (fetchConfig.method === "POST") ? J.stringify(fetchConfig.body) : E.right(undefined);

  const params = (fetchConfig.method === "GET") ? fetchConfig.params : "";

  const headers = new Headers({
    "Content-Type": "application/json",
  });
  
  console.log('her', `${url}?${params}`)
  return pipe(
    body,
    TE.fromEither,
    TE.chain(
      TE.tryCatchK((body) =>
        fetch(`${url}?${params}`, {
          method: fetchConfig.method,
          cache: "no-cache",
          headers,
          mode: "cors",
          body,
        }).then(res => res.json()), identity)
    ))
}

