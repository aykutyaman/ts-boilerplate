import { PutItemInput, UpdateItemInput } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
import { save, update, query } from "../awsCalls";
import { config } from "../config";

describe("database experiments to know better dynamodb", () => {
  test("create", (done) => {
    const params = {
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
    } as PutItemInput;

    save(params).then(x => {
      console.log(x);
      done();
    })
  })

  test.only("update", (done) => {
    const params = {
      TableName: "todos1-table-dev",
      Key: {
        pk: "user#1",
        sk: "todo#188813e5-7877-4aa4-9917-b39e47756c20"
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
    } as UpdateItemInput;

    update(params).then(x => {
      console.log(x);
      done();
    }).catch(e => {
      console.log(e);
      done();
    })
  })

  test("query", (done) => {
    const params = {
      TableName: config.TODOS_TABLE,
      KeyConditionExpression: "pk = :userid and begins_with(sk, :todokey)",
      ExpressionAttributeValues: {
        ":userid": "user#1",
        ":todokey": "todo#"
      }
    } as any;

    query(params).then((x: any) => {
      // console.log(JSON.stringify(x, null, 2)); 
      done();
    })
  })
})

export {}
