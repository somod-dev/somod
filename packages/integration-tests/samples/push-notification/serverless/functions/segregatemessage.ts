import { DynamoDB } from "aws-sdk";
import { DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";

const ddb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

const handleRecord = async (record: DynamoDBRecord) => {
  const message = DynamoDB.Converter.unmarshall(
    record.dynamodb?.NewImage || {}
  ) as {
    messageId: string;
    message: unknown;
    audience: { userId?: string; groupId?: string };
  };

  if (typeof message.message["type"] === "string") {
    ddb.put({
      TableName: process.env.MESSAGE_TYPE_TABLE_NAME,
      Item: {
        type: message.message["type"],
        messageId: message.messageId
      }
    });
  }
};

const handler: DynamoDBStreamHandler = async event => {
  for (const record of event.Records) {
    if (record.eventName == "INSERT") {
      await handleRecord(record);
    }
  }
};

export default handler;
