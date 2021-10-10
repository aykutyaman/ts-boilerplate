import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

const client = new DynamoDB.DocumentClient({ region: "eu-central-1" }); // TODO: move region to env

export const save = (params: DocumentClient.PutItemInput) => {
  return client.put(params).promise();
}

export const update = (params: DocumentClient.UpdateItemInput) => {
  return client.update(params).promise();
}

export const query = (params: DocumentClient.QueryInput) => {
  return client.query(params).promise();
}

export const remove = (params: DocumentClient.DeleteItemInput) => {
  return client.delete(params).promise();
}

export const scan = (params: DocumentClient.ScanInput) => {
  return client.scan(params).promise();
}
