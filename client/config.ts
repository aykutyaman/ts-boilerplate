import { pipe } from "fp-ts/function";
import { fold } from "fp-ts/lib/Either";
import { failure } from "io-ts/lib/PathReporter";
import * as t from "io-ts";
import { NonEmptyString } from "io-ts-types/lib/NonEmptyString";

const Config = t.type(
  {
    REACT_APP_API_ENDPOINT: NonEmptyString
  },
  "Config"
);

export const config = pipe(
  process.env,
  Config.decode,
  fold(
    errors => {
      throw new Error(["Invalid config provided:", failure(errors)].join("\n"));
    },
    env => ({
      apiEndpoint: env.REACT_APP_API_ENDPOINT
    })
  )
);
