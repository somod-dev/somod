import { JSONSchema7 } from "json-schema";
import { HttpLambda } from "../src/handler";
import {
  DefaultHeaderType,
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

describe("Handlers", () => {
  test(" with mocking - http Request Handler ", async () => {
    const event = {
      version: "2.0",
      routeKey: "POST /resource/path/{id}",
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
          path: "/resource/path/{id}",
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

    const httpLambda = new HttpLambda();
    httpLambda.register({
      httpMethod: "post",
      path: "/resource/path/{id}",
      lambdaFn: lambdaFn,
      options: options
    });

    const response = httpLambda.getHandler();
    expect(exptRespose).toEqual(await response(event));
  });

  test(" negative case - with mocking - http Request Handler ", async () => {
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
          path: "/resource/path/{id}",
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

    const lambdaFn2: LambdaCallbackType<
      DefaultHeaderType,
      DefaultPathParamsType,
      string
    > = request => {
      return new Promise<string>(resolve => {
        if (
          request.headers &&
          request.queryStringParameters === "I am mocked - QueryStrings"
        ) {
          return resolve("Mock is working");
        } else {
          return resolve("Mock is not working");
        }
      });
    };

    const exptRespose: HttpResponse = {
      body: "Internal Server Error",
      statusCode: 500
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

    const options2: Options<DefaultHeaderType, DefaultPathParamsType, string> =
      {
        pathParams: {
          schema: { type: "object" }
        },
        queryStrings: {
          schema: {
            type: "string"
          }
        }
      };

    const options3 = {};
    const httpLambda = new HttpLambda();
    httpLambda.register({
      path: "get",
      httpMethod: "/resource/path/{id}",
      lambdaFn: lambdaFn,
      options: options
    });

    httpLambda.register({
      path: "post",
      httpMethod: "/resource/nopath/{id}",
      lambdaFn: lambdaFn2,
      options: options2
    });

    //this reregister should overwrite previous one
    httpLambda.register({
      path: "post",
      httpMethod: "/resource/nopath/{id}",
      lambdaFn: lambdaFn2,
      options: options3
    });

    const response = httpLambda.getHandler();
    expect(await response(event)).toEqual(exptRespose);
  });

  test(" Request Handler return passed path params ", async () => {
    const event = {
      version: "2.0",
      routeKey: "POST /resource/path/{id}",
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
          path: "/resource/path/{id}",
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
        id: "2"
      },
      isBase64Encoded: false
    };

    const lambdaFn: LambdaCallbackType<
      string,
      DefaultPathParamsType,
      string
    > = request => {
      return new Promise<string>(resolve => {
        return resolve(request.pathParams["id"]);
      });
    };

    const exptRespose: HttpResponse = {
      body: "2",
      headers: {
        "content-type": "text/plain"
      },
      statusCode: 200
    };

    const pathParams: JSONSchema7 = {
      type: "object",
      additionalProperties: false,
      patternProperties: {
        id: { type: "string" }
      }
    };

    const options: Options<string, DefaultPathParamsType, string> = {
      headers: {
        schema: {
          type: "string"
        }
      },
      pathParams: {
        fnParser: pathParams => {
          return pathParams;
        },
        schema: pathParams
      },
      queryStrings: {
        schema: {
          type: "string"
        }
      }
    };

    const httpLambda = new HttpLambda();
    httpLambda.register({
      httpMethod: "post",
      path: "/resource/path/{id}",
      lambdaFn: lambdaFn,
      options: options
    });

    const response = httpLambda.getHandler();
    expect(exptRespose).toEqual(await response(event));
  });
});

describe("meta data tests", () => {
  test(" get meta data for path ", async () => {
    const event = {
      version: "2.0",
      routeKey: "POST /resource/path/{id}",
      rawPath: "/",
      rawQueryString: "",
      headers: {
        accept: "*/*",
        "sodaru-http-meta": "true",
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
          path: "/resource/path/{id}",
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
        id: "2"
      },
      isBase64Encoded: false
    };

    const lambdaFn: LambdaCallbackType<
      string,
      DefaultPathParamsType,
      string
    > = request => {
      return new Promise<string>(resolve => {
        return resolve(request.pathParams["id"]);
      });
    };

    const schema = {
      request: {
        schemas: {
          header: {
            type: "string"
          },
          body: {
            type: "object",
            additionalProperties: false,
            patternProperties: {
              id: { type: "string" }
            }
          },
          pathParameter: null,
          queryString: {
            type: "object",
            patternProperties: {
              "^id": { type: "string" }
            }
          }
        }
      },
      response: {
        code: 999,
        headers: { headerkey: "headerval" }
      }
    };

    const exptRespose: HttpResponse = {
      body: JSON.stringify(schema),
      headers: { "content-type": "application/json" },
      statusCode: 200
    };

    const options: Options<string, DefaultPathParamsType, string> = {
      headers: {
        schema: {
          type: "string"
        }
      },
      queryStrings: {
        schema: {
          type: "object",
          patternProperties: {
            "^id": { type: "string" }
          }
        }
      },
      body: {
        schema: {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            id: { type: "string" }
          }
        }
      },
      statusCode: 999,
      responseHeaders: { headerkey: "headerval" }
    };

    const httpLambda = new HttpLambda();
    httpLambda.register({
      httpMethod: "post",
      path: "/resource/path/{id}",
      lambdaFn: lambdaFn,
      options: options
    });

    const response = httpLambda.getHandler();
    expect(exptRespose).toEqual(await response(event));
  });
});
