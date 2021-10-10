import { flow, identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import * as E from "fp-ts/Either";
import { v4 as uuid } from "uuid";
import { TodosPayload, TogglePayload, AddTodoPayload, DeleteTodoPayload } from "../shared/api";
import { Todos } from "../shared/domain";
import { failure } from "io-ts/PathReporter";
import * as TE from "fp-ts/TaskEither";
import { query, remove, save, update } from "./awsCalls";
import { config } from "./config";
import { has } from "fp-ts/lib/ReadonlyRecord";
import { AWSReject, dynamoDBItemError, Error } from "./error";

export const getTodos = ({ status }: TodosPayload): TE.TaskEither<Error, Todos> => {
  const params: DocumentClient.QueryInput = {
    TableName: config.TODOS_TABLE,
    KeyConditionExpression: "pk = :userid and begins_with(sk, :todokey)",
    ExpressionAttributeValues: {
      ":userid": "user#1",
      ":todokey": "todo#"
    }
  };

  return pipe(
    TE.tryCatch(() => query(params), flow(String, AWSReject)),
    TE.chain(todos => todos.Items ? TE.right(todos.Items) : TE.right([])),
    TE.chainW(itemList => pipe(
      itemList,
      A.traverse(O.Applicative)(
        (item: DocumentClient.AttributeMap) => has('data', item) && has('pk', item) && has('sk', item)
          ? O.some(item)
          : O.none
      ),
      TE.fromOption(() => dynamoDBItemError("DynamoDB::Item structure is not valid")),
    )),
    TE.map(x => x.map(({ data}) => ({ ...data}))),
    TE.chainEitherKW(x => pipe(
      Todos.decode(x),
      E.mapLeft(errors => failure(errors).join("\n")),
    )),
    TE.map(todos => todos.filter(todo => { // TODO: add status to the DB query
      if (status === "all") return true;
      if (status === "active" && todo.completed === false) return true;
      if (status === "completed" && todo.completed === true) return true;
      return false;
    }))
  )
}

export const toggleTodo = ({ id, completed }: TogglePayload): TE.TaskEither<string, boolean> => {
  const params: DocumentClient.UpdateItemInput = {
      TableName: config.TODOS_TABLE,
      Key: {
        pk: "user#1",
        sk: `todo#${id}`
      },
      UpdateExpression: "set #data.#completed = :newcompleted",
      ExpressionAttributeNames: {
        "#data": "data",
        "#completed": "completed"
      },
      ExpressionAttributeValues: {
        ":newcompleted": completed
      }
    };
  return pipe(
    TE.tryCatch(() => update(params), String),
    TE.bimap(
      e => e,
      () => true
    ),
  )
}

export const addTodo = ({ text }: AddTodoPayload): TE.TaskEither<string, string> => {
  const id = uuid();
  const params: DocumentClient.PutItemInput = {
    TableName: config.TODOS_TABLE,
    Item: {
      pk: "user#1",
      sk: `todo#${id}`,
      data: {
        id,
        creationDate: new Date().toISOString(),
        text,
        completed: false,
        color: "green"
      }
    }
  };

  return pipe(
    TE.tryCatch(() => save(params), String),
    TE.bimap(x => x, () => id), // TODO: create error type
  )
}

export const deleteTodo = ({ id }: DeleteTodoPayload): TE.TaskEither<string, boolean> => {
  const params: DocumentClient.DeleteItemInput = {
    TableName: config.TODOS_TABLE,
    Key: {
      pk: "user#1",
      sk: `todo#${id}`
    }
  };
  return pipe(
    TE.tryCatch(() => remove(params), String),
    TE.bimap(x => x, () => true)
  )
}
