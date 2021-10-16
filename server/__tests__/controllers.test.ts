import { addTodo, deleteTodo, getTodos, toggleTodo } from "../controllers";
import * as TE from "fp-ts/TaskEither";
import * as IOE from "fp-ts/IOEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";
import { mocked } from "ts-jest/utils"
import { update, query, save, remove } from "../awsCalls"
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError, Response } from "aws-sdk";
import { deepStrictEqual } from "assert";
import { failure } from "io-ts/PathReporter";
import { AWSReject, dynamoDBItemError } from "../error";
import { match } from "ts-pattern";
import { Error } from "../error";

import QueryOutput = DocumentClient.QueryOutput;
import UpdateItemOutput = DocumentClient.UpdateItemOutput;
import PutItemOutput = DocumentClient.PutItemOutput;
import DeleteItemOutput = DocumentClient.DeleteItemOutput;

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

    const lifted = pipe(
      result,
      E.mapLeft(error => match<Error, string>(error)
        .with(({_tag: "DecodingErrors"}), errors => failure(errors.errors).join("\n"))
        .otherwise(() => ''))
    )

    deepStrictEqual(lifted, E.left("Invalid value 1 supplied to : Array<Todo>/0: Todo/completed: boolean"));
  });
});

describe("toggleTodo", () => {
  beforeEach(() => {
    mocked(update).mockClear();
  })

  test("toggle", async () => {
    const id = "ccc70020-097d-45da-82a5-3dcb35e37965";
    const mockedUpdate = mocked(update)
      .mockImplementation((): Promise<PromiseResult<UpdateItemOutput, AWSError>> => {
        return Promise.resolve({
          $response: {} as Response<UpdateItemOutput, AWSError>,
          Attributes: {
            sk: 'todo#${id}',
            pk: 'user#1',
            data: {
              id,
              color: 'red',
              completed: true,
              creationDate: "2021-10-06T12:57:25.888Z", // TODO: check this with the running app
              text: 'hello world'
            }
          }
        });
      });

    const result = await toggleTodo({ id, completed: true })();

    expect(mockedUpdate).toBeCalledTimes(1);

    deepStrictEqual(result, E.right({
      id,
      color: 'red',
      completed: true,
      creationDate: new Date("2021-10-06T12:57:25.888Z"), // TODO: check this with the running app
      text: 'hello world'
    }))
  });

  test("addTodo", async () => {

    const mockedUpdate = mocked(save)
      .mockImplementation((): Promise<PromiseResult<PutItemOutput, AWSError>> => {
        return Promise.resolve({
          $response: {} as Response<PutItemOutput, AWSError> });
      });

    const result = await addTodo({ text: "hello world" })();

    expect(mockedUpdate).toBeCalledTimes(1);

    deepStrictEqual(E.isRight(result), true);

  });

  test("deleteTodo", async () => {
    const mockedUpdate = mocked(remove)
      .mockImplementation((): Promise<PromiseResult<DeleteItemOutput, AWSError>> => {
        return Promise.resolve({
          $response: {} as Response<DeleteItemOutput, AWSError> });
      });

    const result = await deleteTodo({ id: "be1d577b-8a6c-4836-9e09-2f04e9b00611" })();

    expect(mockedUpdate).toBeCalledTimes(1);

    deepStrictEqual(E.isRight(result), true);
  });
});
