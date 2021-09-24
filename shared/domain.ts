/* eslint-disable @typescript-eslint/no-redeclare */
import * as t from "io-ts";
import * as Eq from "fp-ts/Eq";
import { DateFromISOString, UUID } from "io-ts-types";

export const Color = t.union([t.literal("green"), t.literal("blue"), t.literal("red")])
export type Color = t.TypeOf<typeof Color>;
export const eqColor: Eq.Eq<Color> = Eq.eqStrict;

export const Todo = t.type({
  id: UUID,
  text: t.string,
  completed: t.boolean,
  color: Color,
  creationDate: DateFromISOString
}, "Todo")

export type Todo = t.TypeOf<typeof Todo>;

export const Todos = t.array(Todo);

export type Todos = t.TypeOf<typeof Todos>;

export const Status = t.union([t.literal("all"), t.literal("active"), t.literal("completed")])
export type Status = t.TypeOf<typeof Status>;
export const eqStatus: Eq.Eq<Status> = Eq.eqStrict;

export const Filter = t.type({
  color: Color,
  status: Status
})
export type Filter = t.TypeOf<typeof Filter>;
export const eqFilter = Eq.struct<Filter>({
  color: eqColor,
  status: eqStatus
})

