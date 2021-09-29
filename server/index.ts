import express from "express";
import http from "http";
import cors from "cors";
import { api } from "../shared/api";
import * as Controllers from "./controllers";
import { addAPIToExpress } from "./express";

const app = express();

const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

addAPIToExpress(app, api, Controllers);

server.listen(8081, () => console.log('server started'));
const exit = () => {
  server.close();
  process.exit();
}
process.on("exit", exit);
process.on("SIGINT", exit);
process.on("uncaughtException", exit);

export default app;
