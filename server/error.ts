export type DynamoDBItemError = {
  _tag: "DynamoDBItemError",
  message: string
}

export const dynamoDBItemError = (message: string): DynamoDBItemError => ({
  _tag: "DynamoDBItemError",
  message
})

export type AWSReject = {
  _tag: "AWSReject",
  message: string
}

export const AWSReject = (message: string): AWSReject => ({
  _tag: "AWSReject",
  message
})

// TODO: make string free our Error type
export type Error = DynamoDBItemError | string | AWSReject;
