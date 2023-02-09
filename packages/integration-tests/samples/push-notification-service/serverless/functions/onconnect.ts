import { DynamoDB } from "aws-sdk";
import {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2
} from "aws-lambda";
import fetch from "node-fetch";

const ddb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

const authenticate = async (
  event: APIGatewayProxyWebsocketEventV2 & { headers?: Record<string, string> }
) => {
  if (process.env.AUTH_END_POINT && event.headers) {
    const url = process.env.AUTH_END_POINT;
    const token = event.headers["sec-websocket-protocol"];

    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token }
    });
    if (res.status == 200) {
      const content = await res.json();
      return content;
    } else {
      throw new Error("Unauthorized");
    }
  } else {
    throw new Error("Unauthorized");
  }
};

const handler: APIGatewayProxyWebsocketHandlerV2 = async event => {
  let authResult;
  try {
    authResult = await authenticate(event);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return {
      statusCode: 401
    };
  }

  try {
    await ddb
      .transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: process.env.CONNECTIONS_TABLE_NAME as string,
              Item: {
                connectionId: event.requestContext.connectionId,
                userId: authResult.id
              }
            }
          },
          {
            Put: {
              TableName: process.env.USERS_TABLE_NAME as string,
              Item: authResult
            }
          }
        ]
      })
      .promise();
  } catch (err) {
    return {
      statusCode: 500,
      body: "Failed to connect: " + JSON.stringify(err)
    };
  }

  return { statusCode: 200, body: "Connected." };
};

export default handler;
