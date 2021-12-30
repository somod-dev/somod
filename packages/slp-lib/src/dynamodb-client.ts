import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB({ apiVersion: "2012-08-10" });

export default dynamoDb;

export const createSet = (
  list: string[] | number[],
  type: "string" | "number" | "binary" = "string"
): DynamoDB.DocumentClient.DynamoDbSet => {
  const typeToDynamoDBKeyMap = {
    string: "SS",
    number: "NS",
    binary: "BS"
  };
  return DynamoDB.Converter.output({ [typeToDynamoDBKeyMap[type]]: list });
};

export const getItem = <T = Record<string, unknown>>(
  params: DynamoDB.GetItemInput
): Promise<T> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .getItem(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(DynamoDB.Converter.unmarshall(data.Item) as T);
        }
      })
      .on("error", err => reject(err));
  });
};

export const updateItem = <T = Record<string, unknown>>(
  params: DynamoDB.UpdateItemInput
): Promise<T> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .updateItem(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(DynamoDB.Converter.unmarshall(data.Attributes) as T);
        }
      })
      .on("error", err => reject(err));
  });
};

export const putItem = <T = Record<string, unknown>>(
  params: DynamoDB.PutItemInput
): Promise<T> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .putItem(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(DynamoDB.Converter.unmarshall(data.Attributes) as T);
        }
      })
      .on("error", err => reject(err));
  });
};

export const deleteItem = <T = Record<string, unknown>>(
  params: DynamoDB.DeleteItemInput
): Promise<T> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .deleteItem(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(DynamoDB.Converter.unmarshall(data.Attributes) as T);
        }
      })
      .on("error", err => reject(err));
  });
};

export const scan = <T>(params: DynamoDB.ScanInput): Promise<T> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .scan(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(
            data.Items.map(item =>
              DynamoDB.Converter.unmarshall(item)
            ) as unknown as T
          );
        }
      })
      .on("error", err => reject(err));
  });
};

const _query = (params: DynamoDB.QueryInput): Promise<DynamoDB.QueryOutput> => {
  return new Promise((resolve, reject) => {
    dynamoDb
      .query(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
      .on("error", err => reject(err));
  });
};

export type QueryInputForPagination = DynamoDB.QueryInput & {
  Limit: number;
};

export type QueryOutputForPagination<T extends Record<string, unknown>> = {
  LastEvaluatedKey: DynamoDB.Key | null;
  Items: T[];
  Limit: number;
};

export const queryWithPagination = async <T extends Record<string, unknown>>(
  params: QueryInputForPagination
): Promise<QueryOutputForPagination<T>> => {
  const result = await _query(params);
  return {
    LastEvaluatedKey: result.LastEvaluatedKey,
    Items: result.Items.map(item => DynamoDB.Converter.unmarshall(item)) as T[],
    Limit: params.Limit
  };
};

export type QueryInputForAll = Omit<
  DynamoDB.QueryInput,
  "ExclusiveStartKey" | "Limit"
>;

export const queryAll = async <T extends Record<string, unknown>>(
  params: QueryInputForAll
): Promise<T[]> => {
  let lastEvaluatedKey: DynamoDB.Key = null;
  const result: T[] = [];

  do {
    const _params: DynamoDB.QueryInput = params;
    if (lastEvaluatedKey) {
      _params.ExclusiveStartKey = lastEvaluatedKey;
    }
    const data = await _query(_params);
    result.push(
      ...(data.Items.map(item => DynamoDB.Converter.unmarshall(item)) as T[])
    );

    lastEvaluatedKey = data.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return result;
};
