import { constant, flow, pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as S from "fp-ts/State";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import * as E from "fp-ts/Either";
import { TodosPayload, TogglePayload, AddTodoPayload, DeleteTodoPayload } from "../shared/api";
import { Todo, Todos } from "../shared/domain";
import * as TE from "fp-ts/TaskEither";
import { query, remove, save, update } from "./awsCalls";
import { config } from "./config";
import { has } from "fp-ts/lib/ReadonlyRecord";
import { AWSReject, decodingErrors, dynamoDBItemError, Error } from "./error";
import { uuid } from "./random";
import { UUID } from "io-ts-types";

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
      E.mapLeft(decodingErrors),
    )),
    TE.map(todos => todos.filter(todo => { // TODO: add status to the DB query
      if (status === "all") return true;
      if (status === "active" && todo.completed === false) return true;
      if (status === "completed" && todo.completed === true) return true;
      return false;
    }))
  )
}

export const toggleTodo = ({ id, completed }: TogglePayload): TE.TaskEither<Error, Todo> => {
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
    },
    ReturnValues: "ALL_NEW"
  };
  return pipe(
    TE.tryCatch(() => update(params), flow(String, AWSReject)),
    TE.chain(response => response.Attributes
      ? TE.right(response.Attributes)
      : TE.left(AWSReject("no-attributes"))),
    TE.chain(attributes => TE.fromOption(
      () => AWSReject("no-data-prop"))(O.fromNullable(attributes.data))),
    TE.chainEitherKW(x => pipe(Todo.decode(x), E.mapLeft(decodingErrors))),
  )
}

export const addTodo = ({ text }: AddTodoPayload): TE.TaskEither<Error, Todo> => pipe(
  TE.Do,
  TE.bind("uuid", () => pipe(
    IO.Do,
    IO.bind("seed", () => IO.of(new Date().getTime())),
    IO.map(({ seed }) => pipe(
      uuid,
      S.evaluate(seed),
      UUID.decode,
      E.mapLeft(decodingErrors),
    )),
    TE.fromIO,
    TE.chain(TE.fromEither),
  )),
  TE.bind("todo", ({ uuid }) => pipe(
    Todo.decode({
      id: uuid,
      text,
      completed: false,
      color: "green",
      creationDate: new Date().toISOString(),
    }),
    E.mapLeft(decodingErrors),
    TE.fromEither,
  )),
  TE.chainW(({ todo }) => {
    const params: DocumentClient.PutItemInput = {
      TableName: config.TODOS_TABLE,
      Item: {
        pk: "user#1",
        sk: `todo#${todo.id}`,
        data: Todo.encode(todo)
      }
    };

    return pipe(
      TE.tryCatch(() => save(params), flow(String, AWSReject)),
      TE.map(() => todo),
    )
  })
)

export const deleteTodo = ({ id }: DeleteTodoPayload): TE.TaskEither<Error, boolean> => {
  const params: DocumentClient.DeleteItemInput = {
    TableName: config.TODOS_TABLE,
    Key: {
      pk: "user#1",
      sk: `todo#${id}`
    }
  };
  return pipe(
    TE.tryCatch(() => remove(params), flow(String, AWSReject)),
    TE.map(constant(true))
  )
}
