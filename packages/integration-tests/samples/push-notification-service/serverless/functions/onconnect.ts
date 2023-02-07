import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";

const ddb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async event => {
  try {
    await ddb
      .put({
        TableName: process.env.TABLE_NAME as string,
        Item: {
          connectionId: event.requestContext.connectionId
        }
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
