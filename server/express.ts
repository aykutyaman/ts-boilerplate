import { Application, json } from "express";
import { Endpoint } from "../shared/dsl";
import * as E from "fp-ts/Either";
import { failure } from "io-ts/PathReporter";
import * as t from "io-ts";
import { record } from "fp-ts/Record";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Error } from "./error";

// type Controller<I, O> = (input: I) => Promise<O>;
type Controller<I, O> = (input: I) => TE.TaskEither<Error, O>;

const addEndpointToExpress = <I, O>(app: Application, endpoint: Endpoint<I,O>, controller: Controller<I, O>) => {
  app.post(endpoint.path, (req, res) => pipe(
    endpoint.input.decode(req.body),
    E.bimap(
      errors => res.send(422).send(failure(errors).join("\n")),
      decodedInput => {
        controller(decodedInput)().then(result => pipe(
          result,
          E.fold(
            e => res.status(500).end(e),
            output => res.status(200).json(endpoint.output.encode(output))
          )
        ));
      }
    )
  ));
}


export const addAPIToExpress = <A extends Record<string, Endpoint<any, any>>>(
  app: Application,
  api: A,
  controllers: {
    [K in keyof A]: Controller<t.TypeOf<A[K]["input"]>, t.TypeOf<A[K]["output"]>>
  }
): void => {
  record.mapWithIndex(api, (k, endpoint) => {
    addEndpointToExpress(app, endpoint, controllers[k])
  })
}
