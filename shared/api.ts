import * as t from "io-ts";
import * as Eq from "fp-ts/Eq";
import { Endpoint } from "./dsl";
import { Status, Todos, eqStatus } from "./domain";

export const TodosPayload = t.type({
  status: Status
}, "TodosPayload");
export type TodosPayload = t.TypeOf<typeof TodosPayload>;
export const eqTodosPayload = Eq.struct<TodosPayload>({
  status: eqStatus
})

export const TogglePayload = t.type({
  id: t.string,
  completed: t.boolean
}, "TogglePayload");
export type TogglePayload = t.TypeOf<typeof TogglePayload>;

export const AddTodoPayload = t.type({
  text: t.string
}, "AddTodo");
export type AddTodoPayload = t.TypeOf<typeof AddTodoPayload>;

export const DeleteTodoPayload = t.type({
  id: t.string,
}, "DeleteTodoPayload")
export type DeleteTodoPayload = t.TypeOf<typeof DeleteTodoPayload>;

export const api = {
  getTodos: Endpoint("/api/todos", TodosPayload, Todos),
  toggleTodo: Endpoint("/api/todos/toggle", TogglePayload, t.boolean),
  deleteTodo: Endpoint("/api/todos/delete", DeleteTodoPayload, t.boolean),
  addTodo: Endpoint("/api/todos/add", AddTodoPayload, t.string)
}
