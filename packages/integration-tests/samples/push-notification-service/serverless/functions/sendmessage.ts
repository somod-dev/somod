import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";

type Connection = {
  connectionId: string;
  userId: string;
};

const ddb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION
});

const apigwManagementApiConnections: Record<string, ApiGatewayManagementApi> =
  {};

const getApigwManagementApi = (endpoint: string) => {
  if (apigwManagementApiConnections[endpoint] === undefined) {
    apigwManagementApiConnections[endpoint] = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint
    });
  }
  return apigwManagementApiConnections[endpoint];
};

const getUsersOfGroup = async (groupId: string): Promise<string[]> => {
  const usersOfGroup = await ddb
    .query({
      TableName: process.env.USERS_TABLE_NAME as string,
      IndexName: "byGroupId",
      KeyConditionExpression: "groupId = :groupId",
      ExpressionAttributeValues: {
        ":groupId": groupId
      }
    })
    .promise();

  return (usersOfGroup.Items || [])?.map(userOfGroup => userOfGroup.userId);
};

const listConnections = async (): Promise<Connection[]> => {
  const connections = await ddb
    .scan({
      TableName: process.env.CONNECTIONS_TABLE_NAME as string
    })
    .promise();

  return (connections.Items || [])?.map(connection => ({
    connectionId: connection.connectionId as string,
    userId: connection.userId as string
  }));
};

const filterConnections = (connections: Connection[], users: string[]) => {
  const usersMap = Object.fromEntries(users.map(u => [u, true]));
  return connections.filter(connection => usersMap[connection.userId]);
};

const sendMessage = async (connectionId: string, message: unknown) => {
  const apigwManagementApi = getApigwManagementApi(
    process.env.CONNECTIONS_ENDPOINT as string
  );

  const data = typeof message == "string" ? message : JSON.stringify(message);

  await apigwManagementApi
    .postToConnection({ ConnectionId: connectionId, Data: data })
    .promise();
};

const handleRecord = async (record: DynamoDBRecord) => {
  const message = DynamoDB.Converter.unmarshall(
    record.dynamodb?.NewImage || {}
  ) as {
    messageId: string;
    message: unknown;
    audience: { userId?: string; groupId?: string };
  };

  const users: string[] = [];
  if (message.audience.userId) {
    users.push(message.audience.userId);
  } else if (message.audience.groupId) {
    users.push(...(await getUsersOfGroup(message.audience.groupId)));
  }

  const connections = await listConnections();

  const eligibleConnections = filterConnections(connections, users);

  const sendMessageResult = await Promise.allSettled(
    eligibleConnections.map(async connection => {
      await sendMessage(connection.connectionId, message.message);
    })
  );

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      messageId: message.messageId,
      audience: message.audience,
      noOfEligibleUsers: users.length,
      noOfEligibleConnections: eligibleConnections.length,
      noOfFailedConnections: sendMessageResult.filter(
        result => result.status == "rejected"
      ).length
    })
  );
};

const handler: DynamoDBStreamHandler = async event => {
  for (const record of event.Records) {
    if (record.eventName == "INSERT") {
      await handleRecord(record);
    }
  }
};

export default handler;
