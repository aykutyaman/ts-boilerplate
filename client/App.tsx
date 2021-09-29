import * as React from "react";
import { useAPI } from "./useAPI";
import { apiClient as api } from "./API";
import * as RD from "@devexperts/remote-data-ts";
import { pipe } from "fp-ts/lib/function";
import * as D from "../shared/domain";
import { eqTodosPayload } from "../shared/api";
import { useState } from "react";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

type TodoProps = {
  todo: D.Todo, onTodoDelete: (id: string) => void, onToggle: (id: string, completed: boolean) => void
}
const Todo = ({ todo, onTodoDelete, onToggle }: TodoProps): JSX.Element => {
  return (
    <li style={{listStyleType: "none"}}>
      <input type="checkbox" checked={!!todo.completed} onChange={() => onToggle(todo.id, !todo.completed)}/>
        {todo.text} - {todo.creationDate.toDateString()}
        <button onClick={() => onTodoDelete(todo.id)}>
        x
        </button>
    </li>
  );
}

type TodosProps = {
  todos: RD.RemoteData<unknown, D.Todos>,
  onTodoDelete: (id: string) => void,
  onToggle: (id: string, completed: boolean) => void
}
const Todos = ({ todos, onTodoDelete, onToggle }: TodosProps): JSX.Element | null => (
  pipe(
    todos,
    RD.fold(
      () => <div>initial</div>,
      () => null,
      () => <div>error</div>,
      (todos) => (
        <ul className="todos-list">
          {todos.map(todo => <Todo todo={todo} onTodoDelete={onTodoDelete} onToggle={onToggle} key={todo.id} />)}
        </ul>
      )
    )
  )
)

const App = (): JSX.Element => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<D.Status>("all");
  
  const [todos, mutate] = useAPI(api.getTodos, { status }, eqTodosPayload);

  const onTodoDelete = (id: string) => {
    pipe(
      api.deleteTodo({ id }),
      TE.map(deleted => deleted && mutate()),
      f => f(),
    )
  }

  const onToggle = (id: string, completed: boolean) => {
    pipe(
      api.toggleTodo({ id, completed }),
      TE.map(toggled => toggled && mutate()),
      f => f()
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const trimmedText = (e.target as HTMLInputElement).value.trim();
    if (e.key === "Enter" && trimmedText) {
      setText('');
      pipe(
        api.addTodo({ text: trimmedText }),
        TE.map(added => added && mutate()),
        f => f()
      )
    }
  }

  const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    pipe(
      D.Status.decode(e.target.value),
      E.map(setStatus)
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
      </a>
      <div className="filters">
      <input
          placeholder="What needs to be done?"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <br />
        <select onChange={onStatusChange}>
          <option>all</option>
          <option>active</option>
          <option>completed</option>
        </select>
      </div>
      <Todos todos={todos} onTodoDelete={onTodoDelete} onToggle={onToggle} />
      </header>
    </div>
  );
}

export default App;
