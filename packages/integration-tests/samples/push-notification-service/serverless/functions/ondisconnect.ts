import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const ddb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

const handler: APIGatewayProxyWebsocketHandlerV2 = async event => {
  try {
    await ddb
      .delete({
        TableName: process.env.TABLE_NAME as string,
        Key: {
          connectionId: event.requestContext.connectionId
        }
      })
      .promise();
  } catch (err) {
    return {
      statusCode: 500,
      body: "Failed to disconnect: " + JSON.stringify(err)
    };
  }

  return { statusCode: 200, body: "Disconnected." };
};

export default handler;
