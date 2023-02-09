import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { v1 } from "uuid";

const ddb = new DynamoDB({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

const TABLE_NAME = process.env.TABLE_NAME as string;
const API_KEY = process.env.API_KEY as string;

const handler: APIGatewayProxyHandlerV2 = async event => {
  // authentication
  if (event.headers["authorization"] !== API_KEY) {
    return { statusCode: 401 };
  }

  // sanity
  const body = JSON.parse(event.body || "{}");
  if (body?.message === undefined || body?.audience === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "must have 'message' and 'audience' properties in the body"
      }),
      headers: { "Content-Type": "application/json" }
    };
  }
  if (
    body.audience?.userId === undefined &&
    body.audience?.facilityId === undefined
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "audience property must have 'userId' or 'facilityId'"
      }),
      headers: { "Content-Type": "application/json" }
    };
  }
  // TODO: typecheck for userId and facilityId

  const messageId = v1();

  await ddb
    .putItem({
      TableName: TABLE_NAME,
      Item: DynamoDB.Converter.marshall({
        messageId,
        message: body.message,
        audience: body.audience
      })
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId }),
    headers: { "Content-Type": "application/json" }
  };
};

export default handler;
