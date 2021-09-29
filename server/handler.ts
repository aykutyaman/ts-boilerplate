import { Handler } from 'aws-lambda';
import serverless from "serverless-http";
import app from "./index";

export const hello: Handler = serverless(app);
