import { addTodo } from "../controllers";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/function";

test.only("create", async () => {
  const g = await addTodo({ text: "Thank you" })();
  console.log(g)
})
