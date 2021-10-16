import { Errors as IOTSErrors } from "io-ts";
import { match } from "ts-pattern";

const is = <A, B extends A>(fn: (a: A) => boolean) => (a: A): a is B => fn(a);

export type DynamoDBItemError = {
  _tag: "DynamoDBItemError",
  message: string
}

export const dynamoDBItemError = (message: string): DynamoDBItemError => ({
  _tag: "DynamoDBItemError",
  message
})
export const isDynamoDBItemError = is<Error, DynamoDBItemError>(
  error => error._tag === "DynamoDBItemError"
)

export type AWSReject = {
  _tag: "AWSReject",
  message: string
}

export const AWSReject = (message: string): AWSReject => ({
  _tag: "AWSReject",
  message
})

export const isAWSReject = (e: Error): e is AWSReject => e._tag === "AWSReject";

export type DecodingErrors = {
  _tag: "DecodingErrors",
  errors: IOTSErrors
}

export const decodingErrors = (errors: IOTSErrors): DecodingErrors => ({
  _tag: "DecodingErrors",
  errors
})

export const isDecodingErrors = is<Error, DecodingErrors>(
  error => error._tag === "DecodingErrors"
)

export type Error = DynamoDBItemError | AWSReject | DecodingErrors;

type On<A, E> = (err: E) => A;

export const fold = <A>(
  aws: On<A, AWSReject>,
  dynamo: On<A, DynamoDBItemError>,
  decode: On<A, DecodingErrors>
) => (e: Error): A => match<Error>(e)
  .when(isAWSReject, aws)
  .when(isDynamoDBItemError, dynamo)
  .when(isDecodingErrors, decode)
  .exhaustive()
