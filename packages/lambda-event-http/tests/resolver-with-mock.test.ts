import { httpResolver } from "../src/resolver/requestResolver";
import {
  DefaultPathParamsType,
  HttpResponse,
  LambdaCallbackType,
  Options
} from "../src/types/types-http-lambda";

jest.mock("../src/parser/inputParser", () => {
  const originalModule = jest.requireActual("../src/parser/inputParser");
  return {
    __esModule: true,
    ...originalModule,
    parseHeaders: jest.fn(() => "I am mocked - Headers"),
    parseQueryStrings: jest.fn(() => "I am mocked - QueryStrings")
  };
});

test("test with mocking flow - http Request Handler ", async () => {
  const event = {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    rawQueryString: "",
    headers: {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      authorization: "allow",
      host: "execute-api.ap-south-1.amazonaws.com"
    },
    requestContext: {
      accountId: "045615063699",
      apiId: "execute-api",
      authorizer: { lambda: { fromAuthorizerKey: "fromAuthorizerVal" } },
      domainName: "execute-api.ap-south-1.amazonaws.com",
      domainPrefix: "ee4v0vghuj",
      http: {
        method: "POST",
        path: "/",
        protocol: "HTTP/1.1",
        sourceIp: "106.200.209.107",
        userAgent: "Mozilla"
      },
      requestId: "NQ9lThTZBcwEMLA=",
      routeKey: "$default",
      stage: "$default",
      time: "09/Feb/2022:08:06:57 +0000",
      timeEpoch: 1644394017788
    },
    body: '{"intcheck": 123456, "boolcheck": true, "stringcheck": "str"}',
    pathParameters: {
      parameter1: "value1"
    },
    isBase64Encoded: false
  };

  const lambdaFn: LambdaCallbackType<
    string,
    DefaultPathParamsType,
    string
  > = request => {
    return new Promise<string>(resolve => {
      if (
        request.headers === "I am mocked - Headers" &&
        request.queryStringParameters === "I am mocked - QueryStrings"
      ) {
        return resolve("Mock is working");
      } else {
        return resolve("Mock is not working");
      }
    });
  };

  const exptRespose: HttpResponse = {
    body: "Mock is working",
    headers: {
      "content-type": "text/plain"
    },
    statusCode: 200
  };

  const options: Options<string, DefaultPathParamsType, string> = {
    headers: {
      schema: {
        type: "string"
      }
    },
    pathParams: {
      schema: { type: "object" }
    },
    queryStrings: {
      schema: {
        type: "string"
      }
    }
  };

  const response = await httpResolver(event, lambdaFn, options);
  expect(exptRespose).toEqual(response);
});

test("test with mocking flow - http Request Handler ", async () => {
  const event = {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    rawQueryString: "",
    headers: {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      authorization: "allow",
      host: "execute-api.ap-south-1.amazonaws.com"
    },
    requestContext: {
      accountId: "045615063699",
      apiId: "execute-api",
      authorizer: { lambda: { fromAuthorizerKey: "fromAuthorizerVal" } },
      domainName: "execute-api.ap-south-1.amazonaws.com",
      domainPrefix: "ee4v0vghuj",
      http: {
        method: "POST",
        path: "/",
        protocol: "HTTP/1.1",
        sourceIp: "106.200.209.107",
        userAgent: "Mozilla"
      },
      requestId: "NQ9lThTZBcwEMLA=",
      routeKey: "$default",
      stage: "$default",
      time: "09/Feb/2022:08:06:57 +0000",
      timeEpoch: 1644394017788
    },
    body: '{"intcheck": 123456, "boolcheck": true, "stringcheck": "str"}',
    pathParameters: {
      parameter1: "value1"
    },
    isBase64Encoded: false
  };

  const lambdaFn: LambdaCallbackType<
    string,
    DefaultPathParamsType,
    string
  > = request => {
    return new Promise<string>(resolve => {
      if (
        request.headers === "I am mocked - Headers" &&
        request.queryStringParameters === "I am mocked - QueryStrings"
      ) {
        return resolve("Mock is working");
      } else {
        return resolve("Mock is not working");
      }
    });
  };

  const options: Options<string, DefaultPathParamsType, string> = {
    headers: {
      fnParser: () => {
        return "I am being passed, but not mocked";
      },
      schema: {
        type: "object"
      }
    }
  };

  const response = await httpResolver(event, lambdaFn, options);

  expect(response.statusCode).toEqual(400);
  expect(JSON.parse(response.body)["message"]).toEqual(
    //tobe checked : below line dosent specify which property type
    "'' property type must be object"
  );
});
