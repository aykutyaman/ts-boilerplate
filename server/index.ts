import express from "express";
import cors from "cors";
import { api } from "../shared/api";
import * as Controllers from "./controllers";
import { addAPIToExpress } from "./express";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

addAPIToExpress(app, api, Controllers); 


app.listen(8081);
