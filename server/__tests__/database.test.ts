import { v4 as uuid } from "uuid";
import { save, update, query, remove } from "../awsCalls";
import { config } from "../config";

import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import PutItemInput = DocumentClient.PutItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

describe("database experiments to know better dynamodb", () => {
  test("create", (done) => {
    const params: PutItemInput = {
      TableName: config.TODOS_TABLE,
      Item: {
        pk: "user#1",
        sk: `todo#${uuid()}`,
        data: {
          creationDate: Date.now(),
          text: "hello world",
          completed: false,
          color: "red"
        }
      }
    };

    save(params).then(x => {
      done();
    })
  })

  test.only("update", (done) => {
    const params: DocumentClient.UpdateItemInput = {
      TableName: config.TODOS_TABLE,
      Key: {
        pk: "user#1",
        sk: "todo#b27b3d55-2647-45ce-a588-8a341420e9f1"
      },
      UpdateExpression: "set #data.#completed = :newcompleted",
      ExpressionAttributeNames: {
        "#data": "data",
        "#completed": "completed"
      },
      ExpressionAttributeValues: {
        ":newcompleted": true
      },
      ReturnValues: "ALL_NEW"
    }

    update(params).then(x => {
      console.log(x);
      done();
    }).catch(e => {
      console.log(e);
      done();
    })
  })

  test("query", (done) => {
    const params: DocumentClient.QueryInput = {
      TableName: config.TODOS_TABLE,
      KeyConditionExpression: "pk = :userid and begins_with(sk, :todokey)",
      ExpressionAttributeValues: {
        ":userid": "user#1",
        ":todokey": "todo#"
      }
    };

    query(params).then(x => {
      // console.log(JSON.stringify(x, null, 2));
      done();
    })
  })

  test.only("query", (done) => {
    const params: DocumentClient.DeleteItemInput = {
      TableName: config.TODOS_TABLE,
      Key: {
        pk: "user#1",
        sk: `todo#448e93fd-4071-4fbd-b285-d868a8314eab`
      }
    };

    remove(params).then(x => {
      // console.log(JSON.stringify(x, null, 2));
      done();
    })
  })
})

export {}
