```YAML
title: Develop a serverless backend in SOMOD
meta:
  description:
    Developing the serverless backend is made easy with SOMOD
```

# Develop a serverless backend in SOMOD

---

The serverless backend is created using the `template.yaml` file within the `serverless` directory. The lambda function code is created under the `serverless/functions` directory.

The `serverless/template.yaml` is similar to AWS SAM's template, but with added keywords. The keywords are pre-processed while generating the final template intended for AWS deployment. The [`Serverless/Template.yaml`](/reference/main-concepts/serverless/template.yaml) guide describes the anatomy of the SOMOD's `serverless/template.yaml` file.

Each serverless function must have a typescript file with a default export under the `serverless/functions` directory. SOMOD takes care of bundling typescript code into [AWS Lambda's NodeJS Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html) compatible.

## Example:-

Let us implement REST API for User Management.  
The following steps guide you to create your first SOMOD module for User Management REST APIs

1. Create the `Lambda Function` and `DynamoDB Table` resources in the infrastructure code.

   Insert the following code into the `serverless/template.yaml` file

   ```yaml
   # yaml-language-server: $schema=../node_modules/somod-schema/schemas/serverless-template/index.json

   # /serverless/template.yaml

   Resources:
     UserTable:
       Type: AWS::DynamoDB::Table
       SOMOD::Output:
         default: true # returns the table name
         attributes:
           - Arn # returns the ARN of the table
       Properties:
         # The properties are defined in AWS CloudFormation Reference at
         # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html
         TableName:
           SOMOD::ResourceName: User # SOMOD keyword which generates a unique table name during deployment
         BillingMode: PAY_PER_REQUEST
         KeySchema:
           - AttributeName: "userId"
             KeyType: "HASH"
         AttributeDefinitions:
           - AttributeName: "userId"
             AttributeType: "S"

     UserAPILambda:
       Type: AWS::Serverless::Function
       # The properties are defined in AWS SAM Reference at
       # https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html
       Properties:
         CodeUri:
           # With SOMOD::Function keyword, the lambda function code is automatically bundled from the mentioned function name.
           SOMOD::Function:
             name: userApi
         Environment:
           Variables:
             TABLE_NAME:
               SOMOD::Ref:
                 resource: UserTable # Refer the default return value of the UserTable
         Policies:
           - Version: "2012-10-17"
             Statement:
               - Effect: Allow
                 Resource:
                   - SOMOD::Ref: # Refer the Arn Attribute of the UserTable
                       resource: UserTable
                       attribute: Arn
                 Action:
                   - "dynamodb:PutItem"
                   - "dynamodb:Query"
                   - "dynamodb:UpdateItem"
                   - "dynamodb:DeleteItem"
                   - "dynamodb:Scan"
         Events:
           Create:
             Type: HttpApi
             Properties:
               Method: POST
               Path: /user
               ApiId:
                 SOMOD::Ref: # Refer to BaseHttpApi resource provided by the dependent module somod-http-api-gateway
                   resource: BaseHttpApi
                   module: somod-http-api-gateway
           Read:
             Type: HttpApi
             Properties:
               Method: GET
               Path: /user/{id}
               ApiId:
                 SOMOD::Ref:
                   resource: BaseHttpApi
                   module: somod-http-api-gateway
           Update:
             Type: HttpApi
             Properties:
               Method: PUT
               Path: /user/{id}
               ApiId:
                 SOMOD::Ref:
                   resource: BaseHttpApi
                   module: somod-http-api-gateway
           Delete:
             Type: HttpApi
             Properties:
               Method: DELETE
               Path: /user/{id}
               ApiId:
                 SOMOD::Ref:
                   resource: BaseHttpApi
                   module: somod-http-api-gateway
           List:
             Type: HttpApi
             Properties:
               Method: GET
               Path: /user/list
               ApiId:
                 SOMOD::Ref:
                   resource: BaseHttpApi
                   module: somod-http-api-gateway
   ```

2. Install additional libraries required for the Lambda function

   ```
   npm i --save uuid
   npm i --save-dev @types/uuid @types/aws-lambda
   ```

3. Create the type definitions

   Copy the following code into the `lib/types.ts` file.

   ```typescript
   // lib/types.ts

   export type User = {
     name: string;
     email: string;
     dob?: string;
     active: boolean;
     lastUpdatedAt: number;
     createdAt: number;
   };

   export type UserWithId = { userId: string } & User;

   export type CreateUserInput = Omit<User, "lastUpdatedAt" | "createdAt">;

   export type UpdateUserInput = Partial<CreateUserInput>;
   ```

   3.1. Export the type definitions  
    The type definitions can be exported in the `lib/index.ts` to make them available for other modules to use.

   ```typescript
   // lib/index.ts
   export * from "./types";
   ```

4. Create the Lambda function code

   Copy the following code into the `serverless/functions/userApi.ts` file

   ```typescript
   // serverless/functions/userApi.ts

   import { APIGatewayProxyHandlerV2 } from "aws-lambda";
   import { DynamoDB } from "aws-sdk";
   import { v1 as v1uuid } from "uuid";
   import {
     CreateUserInput,
     UpdateUserInput,
     UserWithId
   } from "../../lib/types";

   const dynamoDb = new DynamoDB();

   const createUser = async (tableName: string, user: CreateUserInput) => {
     const userId = v1uuid();
     const now = Date.now();

     const createdUser: UserWithId = {
       userId,
       ...user,
       lastUpdatedAt: now,
       createdAt: now
     };
     await dynamoDb
       .putItem({
         TableName: tableName,
         Item: DynamoDB.Converter.marshall(createdUser)
       })
       .promise();

     return createdUser;
   };

   const readUser = async (tableName: string, userId: string) => {
     const result = await dynamoDb
       .query({
         TableName: tableName,
         KeyConditionExpression: "userId = :userId",
         ExpressionAttributeValues: {
           ":userId": DynamoDB.Converter.input(userId)
         }
       })
       .promise();

     const user = DynamoDB.Converter.unmarshall(
       result.Items?.[0] || {}
     ) as UserWithId;

     return user;
   };

   const updateUser = async (
     tableName: string,
     userId: string,
     user: UpdateUserInput
   ) => {
     const now = Date.now();

     const updateExpressions: string[] = ["#lastUpdatedAt = :lastUpdatedAt"];
     const expressionAttributeNames: DynamoDB.ExpressionAttributeNameMap = {
       "#lastUpdatedAt": "lastUpdatedAt"
     };
     const expressionAttributeValues: DynamoDB.ExpressionAttributeValueMap = {
       ":lastUpdatedAt": DynamoDB.Converter.input(now)
     };

     Object.keys(user).forEach(attr => {
       updateExpressions.push(`#${attr} = :${attr}`);
       expressionAttributeNames[`#${attr}`] = attr;
       expressionAttributeValues[`:${attr}`] = DynamoDB.Converter.input(
         user[attr]
       );
     });

     const result = await dynamoDb
       .updateItem({
         TableName: tableName,
         Key: DynamoDB.Converter.marshall({ userId }),
         UpdateExpression: "SET " + updateExpressions.join(", "),
         ConditionExpression: "attribute_exists(#userId)",
         ExpressionAttributeNames: {
           ...expressionAttributeNames,
           "#userId": "userId"
         },
         ExpressionAttributeValues: expressionAttributeValues,
         ReturnValues: "ALL_NEW"
       })
       .promise();

     return DynamoDB.Converter.unmarshall(result.Attributes) as UserWithId;
   };

   const deleteUser = async (tableName: string, userId: string) => {
     await dynamoDb
       .deleteItem({
         TableName: tableName,
         Key: DynamoDB.Converter.marshall({ userId })
       })
       .promise();
   };

   const listUsers = async (tableName: string) => {
     const result = await dynamoDb
       .scan({
         TableName: tableName
       })
       .promise();

     const users = (result.Items || []).map(item =>
       DynamoDB.Converter.unmarshall(item)
     ) as UserWithId[];

     return users;
   };

   const userApi: APIGatewayProxyHandlerV2 = async event => {
     const tableName = process.env.TABLE_NAME;

     const body = JSON.parse(event.body || "{}");

     const userId = event.pathParameters?.["id"];

     // console.log(JSON.stringify(event, null, 2));

     let result = null;
     switch (event.routeKey) {
       case "POST /user":
         result = await createUser(tableName, body);
         break;
       case "GET /user/{id}":
         result = await readUser(tableName, userId);
         break;
       case "PUT /user/{id}":
         result = await updateUser(tableName, userId, body);
         break;
       case "DELETE /user/{id}":
         result = await deleteUser(tableName, userId);
         break;
       case "GET /user/list":
         result = await listUsers(tableName);
         break;
     }

     return result;
   };

   export default userApi;
   ```

5. Build the module

   ```
   npx somod build -v
   ```

   The build command validates the complete module and generates the `build/` directory.

6. Prepare AWS SAM Project

   ```
   npx somod prepare --serverless -v
   ```

   The prepare command generates the files and directories required by the AWS SAM.

7. Update SOMOD Parameters  
    The prepare command also generates the `parameters.json` file at the root of the project. This file contains all the default values for each of the parameters in the current and all dependent modules.

   For this getting-started project, update the parameters.json as follows

   ```json
   {
     "apigateway.http.endpoint": null,
     "apigateway.http.cors.allow_credentials": false,
     "apigateway.http.cors.allow_headers": [
       "authorization",
       "content-type",
       "content-length"
     ],
     "apigateway.http.cors.allow_methods": ["GET", "POST", "PUT", "DELETE"],
     "apigateway.http.cors.allow_origins": ["http://localhost:3000"],
     "apigateway.http.cors.expose_headers": [],
     "apigateway.http.cors.max_age": 0
   }
   ```

8. Deploy the module to AWS

   ```
   npx somod deploy --guided
   ```

   provide `--guided` options for first-time deployment, later deployments can run without this option.

9. Get the API endpoint URL.
   Run the following command after deployment to get the endpoint URL.

   ```
   npx somod update-params
   ```

   The endpoint is updated in the `parameters.json` file.

10. Test the deployed APIs.

    Run the following curl commands to test that the deployed APIs are working fine.

    Replace the `{ENDPOINT_URL}` with the actual URL from the previous step

    - Create User

      ```
      curl --location --request POST '{ENDPOINT_URL}/user' \
      --header 'Content-Type: application/json' \
      --data-raw '{ "name": "User1", "email": "u1@example.com",  "active": true }'
      ```

    - Read User

      ```
      curl --location --request GET '{ENDPOINT_URL}/user/{ACTUAL_USER_ID}'
      ```

    - Update User

      ```
      curl --location --request PUT '{ENDPOINT_URL}/user/{ACTUAL_USER_ID}' \
      --header 'Content-Type: application/json' \
      --data-raw '{ "email": "user1@example.com" }'
      ```

    - Delete User

      ```
      curl --location --request DELETE '{ENDPOINT_URL}/user/{ACTUAL_USER_ID}'
      ```

    - List Users

      ```
      curl --location --request GET '{ENDPOINT_URL}/user/list'
      ```

Now the REST APIs are ready, let us understand how to create the UI in the [Next Chapter](/getting-started/develop/ui)
