import { DynamoDB } from "aws-sdk";
import { DeleteItemInput, QueryInput, UpdateItemInput } from "aws-sdk/clients/dynamodb";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import PutItemInput = DocumentClient.PutItemInput;

const client = new DynamoDB.DocumentClient({ region: "eu-central-1" }); // TODO: move region to env

export const save = (params: PutItemInput) => {
  return client.put(params).promise();
}

export const update = (params: UpdateItemInput) => {
  return client.update(params).promise();
}

export const query = (params: QueryInput) => {
  return client.query(params).promise();
}

export const remove = (params: DeleteItemInput) => {
  return client.delete(params).promise();
}
