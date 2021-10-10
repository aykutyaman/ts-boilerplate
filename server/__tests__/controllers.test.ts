import { addTodo, getTodos } from "../controllers";
import { Converter } from "aws-sdk/clients/dynamodb";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";
import { mocked } from "ts-jest/utils"
import { save, query } from "../awsCalls"
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError, Response } from "aws-sdk";
import { deepStrictEqual } from "assert";
import { AWSReject, dynamoDBItemError } from "../error";

import QueryOutput = DocumentClient.QueryOutput;

jest.mock("../awsCalls");

describe("getTodos", () => {
  beforeEach(() => {
    mocked(query).mockClear();
  })

  test("getTodos handles error if the DynamoDB item is not valid", async () => {
    const mockedSave = mocked(query)
      .mockImplementation((): Promise<PromiseResult<QueryOutput, AWSError>> => {
        // I don't use $response for now  I don't want to learn its type signature,
        // for this reason cast the $response type
        return Promise.resolve({
          $response: {} as Response<QueryOutput, AWSError>,
          Items: [{ pk: {}, sk: {}, _data_: {}}]
        });
      });

    const result = await getTodos({ status: "all" })();

    expect(mockedSave).toBeCalledTimes(1);
    deepStrictEqual(result, E.left(dynamoDBItemError("DynamoDB::Item structure is not valid")))
  });

  test("getTodos handles promise rejection", async () => {
    const mockedSave = mocked(query).mockImplementation(
      (): Promise<PromiseResult<QueryOutput, AWSError>> => {
        return Promise.reject("Some reason");
      });

    const result = await getTodos({ status: "all" })();

    expect(mockedSave).toBeCalledTimes(1);
    deepStrictEqual(result, E.left(AWSReject("Some reason")));
  });

  test("getTodos happy path", async () => {
    const todo = {
      color: 'green',
      completed: true,
      creationDate: "2021-10-06T12:57:25.888Z", // TODO: is it string?
      id: 'be1d577b-8a6c-4836-9e09-2f04e9b00611',
      text: 'helo'
    }

    const mockedSave = mocked(query)
      .mockImplementation((): Promise<PromiseResult<QueryOutput, AWSError>> => {
        return Promise.resolve({
          $response: {} as Response<QueryOutput, AWSError>,
          Items: [
            {
              pk: {},
              sk: {},
              data: todo
            }
          ]
        });
      });

    const result = await getTodos({ status: "all" })();

    expect(mockedSave).toBeCalledTimes(1);
    deepStrictEqual(result, E.right([{ ...todo, creationDate: new Date(todo.creationDate) }]));
  });

  test("getTodos decodes todos", async () => {
    const mockedSave = mocked(query)
      .mockImplementation((): Promise<PromiseResult<QueryOutput, AWSError>> => {
        return Promise.resolve({
          $response: {} as Response<QueryOutput, AWSError>,
          Items: [
            {
              pk: {},
              sk: {},
              data: {
                color: 'green',
                completed: 1, // here there should be a decoding error
                creationDate: "2021-10-06T12:57:25.888Z",
                id: 'be1d577b-8a6c-4836-9e09-2f04e9b00611',
                text: 'helo'
              }
            }
          ]
        });
      });

    const result = await getTodos({ status: "all" })();
    expect(mockedSave).toBeCalledTimes(1);
    deepStrictEqual(result, E.left("Invalid value 1 supplied to : Array<Todo>/0: Todo/completed: boolean"));
  });
});
