import {} from "aws-lambda";
import { HttpLambda } from "../src/handler";
import {
  parseAdditionalParams,
  parseBody,
  parseHeaders,
  parsePathParams,
  parseQueryStrings
} from "../src/parser/inputParser";
import {
  DefaultHeaderType,
  DefaultPathParamsType,
  HttpResponse,
  LambdaCallbackType,
  Options
} from "../src/types/types-http-lambda";

describe("Parser", () => {
  test("Parse Headers", async () => {
    const inputHeaders = {
      accept: "*/*",
      authorization: "allow",
      "content-length": "0",
      emptyheader: "true",
      host: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com",
      "user-agent": "curl/7.68.0",
      "x-amzn-trace-id": "Root=1-61fcabc7-64c110754f23c4d8700a9c4b",
      "x-forwarded-for": "122.182.210.225",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https"
    };

    const outPutHeaders = parseHeaders(inputHeaders, ["emptyheader", "host"]);
    const expectedHeaders: DefaultHeaderType = {
      emptyheader: "true",
      host: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com"
    };
    expect(expectedHeaders).toEqual(outPutHeaders);
  });

  test("Parse Headers - negative", async () => {
    const inputHeaders = {
      accept: "*/*",
      authorization: "allow",
      "content-length": "0",
      emptyheader: "true",
      host: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com",
      "user-agent": "curl/7.68.0",
      "x-amzn-trace-id": "Root=1-61fcabc7-64c110754f23c4d8700a9c4b",
      "x-forwarded-for": "122.182.210.225",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https"
    };

    const outPutHeaders = parseHeaders(inputHeaders, []);
    const expectedHeaders: DefaultHeaderType = {};
    expect(expectedHeaders).toEqual(outPutHeaders);
  });

  test("Parse Path Parameters", async () => {
    const params = { param1: "value1", param2: "value2" };
    const pathParams = parsePathParams(params);
    const expectedParams = params;
    expect(expectedParams).toEqual(pathParams);
  });

  test("Parse Path Parameters - negative", async () => {
    const params = {};
    const pathParams = parsePathParams(params);
    const expectedParams = params;
    expect(expectedParams).toEqual(pathParams);
  });

  test("Parse query String Parameters", async () => {
    const queryStringParameters = {
      parameter1: "value1,value2",
      parameter2: "value"
    };
    const outQueryStringParams = parseQueryStrings(queryStringParameters);
    const expectedQueryStringParams = queryStringParameters;
    expect(expectedQueryStringParams).toEqual(outQueryStringParams);
  });

  test("Parse query String Parameters - negative", async () => {
    const queryStringParameters = {};
    const outQueryStringParams = parseQueryStrings(queryStringParameters);
    const expectedQueryStringParams = queryStringParameters;
    expect(expectedQueryStringParams).toEqual(outQueryStringParams);
  });
});

describe("parse body", () => {
  test("Parse request body", async () => {
    const body =
      '{"intcheck": 123456, "boolcheck": true, "stringcheck": "str"}';
    const outBody = parseBody(body, "application/json");
    const expectedBody = {
      intcheck: 123456,
      boolcheck: true,
      stringcheck: "str"
    };
    expect(expectedBody).toEqual(outBody);
  });

  test("Parse request", async () => {
    const body = "{}";
    const outBody = parseBody(body, "application/json");
    const expectedBody = {};
    expect(expectedBody).toEqual(outBody);
  });

  test("Parse request body - negative 1", async () => {
    const body = "{}";
    const outBody = parseBody(body, "application/json");
    const expectedBody = {};
    expect(expectedBody).toEqual(outBody);
  });

  test("Parse request body - negative 2", async () => {
    const body = "{'id':123}";

    expect(() => {
      const response = parseBody(body, "application/xml");
      JSON.parse(response["body"] as string);
    }).toThrowError(
      new Error(
        "DataValidationError<>: request header content-type must be 'application/json', but received - application/xml"
      )
    );
  });

  test("Parse request body - negative 3", async () => {
    const body = "{'id':123}";

    expect(() => {
      const response = parseBody(body, "");
      JSON.parse(response["body"] as string);
    }).toThrowError(
      new Error(
        "DataValidationError<>: request header content-type must be 'application/json', but received - "
      )
    );
  });

  test("Parse additional parameters", async () => {
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
          userAgent: "Mozilla",
          customKey: ["cust val 1", "cust val 2"]
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

    const additionalParamsPath = {
      fromAuthKey: "requestContext/authorizer/lambda/fromAuthorizerKey",
      accountIdAdditional: "requestContext/accountId",
      customKey: "requestContext/http/customKey",
      pathParameters: "pathParameters"
    };

    const expResponse = {
      fromAuthKey: "fromAuthorizerVal",
      accountIdAdditional: "045615063699",
      customKey: ["cust val 1", "cust val 2"],
      pathParameters: {
        parameter1: "value1"
      }
    };

    const response = parseAdditionalParams(event, additionalParamsPath);
    expect(response).toEqual(expResponse);
  });

  test("Parse additional parameters - negative 1", async () => {
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
          userAgent: "Mozilla",
          customKey: ["cust val 1", "cust val 2"]
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

    const additionalParamsPath = {};
    const expResponse = {};

    const response = parseAdditionalParams(event, additionalParamsPath);
    expect(response).toEqual(expResponse);
  });

  test("Parse additional parameters - negative 2", async () => {
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
          userAgent: "Mozilla",
          customKey: ["cust val 1", "cust val 2"]
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

    const additionalParamsPath = null;
    const expResponse = null;

    const response = parseAdditionalParams(event, additionalParamsPath);
    expect(response).toEqual(expResponse);
  });

  test("Parse additional parameters - integration test", async () => {
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
    > = (request, additionalParams) => {
      return new Promise<string>(resolve => {
        return resolve(JSON.stringify(additionalParams));
      });
    };
    const exptRespose: HttpResponse = {
      body: JSON.stringify({
        apiIdAdditional: "execute-api",
        accountIdAdditional: "045615063699",
        httpAdditional: {
          method: "POST",
          path: "/resource/path/{id}",
          protocol: "HTTP/1.1",
          sourceIp: "106.200.209.107",
          userAgent: "Mozilla"
        }
      }),
      headers: {
        "content-type": "text/plain"
      },
      statusCode: 200
    };

    const options: Options<string, DefaultPathParamsType, string> = {
      headers: {
        schema: {
          type: "object"
        }
      },
      pathParams: {
        schema: { type: "object" }
      },
      additionalParams: {
        additionalParamsPath: {
          apiIdAdditional: "requestContext/apiId",
          accountIdAdditional: "requestContext/accountId",
          httpAdditional: "requestContext/http"
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

  test("Parse additional parameters - integration test 2", async () => {
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
    > = (request, additionalParams) => {
      return new Promise<string>(resolve => {
        return resolve(JSON.stringify(additionalParams));
      });
    };
    const exptRespose: HttpResponse = {
      body: JSON.stringify({
        apiIdAdditional: "execute-api",
        accountIdAdditional: "045615063699"
      }),
      headers: {
        "content-type": "text/plain"
      },
      statusCode: 200
    };

    const options: Options<string, DefaultPathParamsType, string> = {
      headers: {
        schema: {
          type: "object"
        }
      },
      pathParams: {
        schema: { type: "object" }
      },
      additionalParams: {
        fnAdditionalParams: parseAdditionalParams,
        additionalParamsPath: {
          apiIdAdditional: "requestContext/apiId",
          accountIdAdditional: "requestContext/accountId"
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
