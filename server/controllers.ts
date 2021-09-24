import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import { UUID } from "io-ts-types";
import { v4 as uuid } from "uuid";
import { TodosPayload, TogglePayload, AddTodoPayload, DeleteTodoPayload } from "../shared/api";
import { Todos } from "../shared/domain";
import { failure } from "io-ts/PathReporter";

let todos: Todos = [
  { id: uuid() as UUID, text: "Scala", completed: false, color: "blue", creationDate: new Date()},
  { id: uuid() as UUID, text: "Haskell", completed: true, color: "green", creationDate: new Date() },
  { id: uuid() as UUID, text: "TypeScript", completed: true, color: "red", creationDate: new Date() }
];

export const getTodos = ({ status }: TodosPayload): Promise<Todos> => (
  new Promise(resolve => resolve(todos.filter(todo => {
    if (status === "all") return true;
    if (status === "active" && todo.completed === false) return true;
    if (status === "completed" && todo.completed === true) return true;
    return false;
  })))
)

export const toggleTodo = ({ id }: TogglePayload): Promise<boolean> => (
  new Promise(resolve => {
    console.log('hello WORLDdddddd');
    todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
    resolve(true);
  })             
)

export const addTodo = ({ text }: AddTodoPayload): Promise<string> => (
  new Promise((resolve, reject) => {
    pipe(
      UUID.decode(uuid()),
      E.map(id => {
        todos = [...todos, { id, text, completed: false, color: "green", creationDate: new Date() }];
        return id;
      }), 
      E.bimap(
        e => reject(failure(e).join("\n")),
        resolve
      )
    )
  })
)

export const deleteTodo = ({ id }: DeleteTodoPayload): Promise<boolean> => (
  new Promise(resolve => {
    todos = todos.filter(x => x.id !== id);
    resolve(true);
  })
)

