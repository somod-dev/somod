import { DataValidationError, ResourceConflictError } from "@solib/errors";
import { errorHandler } from "../src/errorHandler/errorHandler";
import {
  httpResolver,
  lambdaResponseHandler
} from "../src/resolver/requestResolver";
import {
  DefaultBodyType,
  DefaultPathParamsType,
  DefaultQueryStringsType,
  HttpResponse,
  LambdaCallbackType,
  Options
} from "../src/types/types-http-lambda";

test("test basic flow - http Request Handler ", async () => {
  const event = {
    version: "2.0",
    routeKey: "$default",
    rawPath: "/",
    rawQueryString: "",
    headers: {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br",
      authorization: "allow",
      "cache-control": "no-cache",
      "content-length": "61",
      "content-type": "application/json",
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
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
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

  const lambdaFn: LambdaCallbackType<string> = request => {
    return new Promise(resolve => {
      const response = { body: {} };
      if (request.headers) response["header"] = request.headers;
      if (request.body) response["body"]["boolcheck"] = true;
      return resolve(response);
    });
  };

  const options: Options<
    string,
    DefaultPathParamsType,
    DefaultQueryStringsType,
    DefaultBodyType
  > = {
    headers: {
      schema: {},
      fnParser: headers => {
        return headers["host"];
      }
    },
    pathParams: {
      schema: {
        type: "object",
        properties: {
          parameter1: { type: "string" }
        },
        additionalProperties: false
      },
      fnParser: pathParams => {
        if (pathParams["parameter1"]) {
          pathParams["parameter1"] = "parser changed value";
        }
        return pathParams;
      }
    },
    body: {
      fnValidator: body => {
        body;
      }
    }
  };

  const exptRespose: HttpResponse = {
    body: '{"body":{"boolcheck":true},"header":"execute-api.ap-south-1.amazonaws.com"}',
    headers: {
      "content-type": "application/json"
    },
    statusCode: 200
  };
  const response = await httpResolver(event, lambdaFn, options);
  expect(exptRespose).toEqual(response);
});

test(" lambda response handler test - josn body", () => {
  const eResp: HttpResponse = {
    statusCode: 200,
    body: '{"body key":"returned body value"}',
    headers: {
      "content-type": "application/json"
    }
  };
  const response = lambdaResponseHandler({
    "body key": "returned body value"
  });

  expect(eResp).toEqual(response);
});

test(" lambda response handler test - negative", () => {
  const eResp: HttpResponse = {
    statusCode: 200,
    body: "",
    headers: {
      "content-type": "text/plain"
    }
  };
  const response = lambdaResponseHandler(undefined);

  expect(eResp).toEqual(response);
});

describe("Http Error Handler", () => {
  test("DataValidationError", () => {
    const expctedResponse: HttpResponse = {
      statusCode: 400,
      body: '{"code":"DataValidationError","message":"test message","module":"","context":{"errorType":"DataValidationError"},"path":"test path","suggestion":"test suggestion"}'
    };

    const validationError = {
      code: "DataValidationError",
      message: "test message",
      context: { errorType: "DataValidationError" },
      path: "test path",
      suggestion: "test suggestion"
    };
    const response = errorHandler(new DataValidationError(validationError));
    expect(expctedResponse.statusCode).toEqual(response.statusCode);
    expect(expctedResponse.body).toEqual(response.body);
    expect(expctedResponse.headers).toEqual(response.headers);
  });

  test("ResourceConflictError", () => {
    const conflictError = {
      code: "ResourceConflictError",
      message: "test message",
      module: "",
      resourceType: "string",
      context: {
        errorType: "DuplicateResourceError",
        testOtherData1: "otherValue1",
        testOtherData12: "otherValue2"
      },
      path: "test path"
    };

    const response = errorHandler(
      new ResourceConflictError("string", conflictError)
    );

    const expctedResponse: HttpResponse = {
      statusCode: 409,
      body: JSON.stringify(conflictError)
    };

    expect(expctedResponse.statusCode).toEqual(response.statusCode);
    expect(expctedResponse.body).toEqual(response.body);
    expect(expctedResponse.headers).toEqual(response.headers);
  });

  test("errorResourceConflictError  - negative", () => {
    const expctedResponse: HttpResponse = {
      statusCode: 500,
      body: "Internal Server Error"
    };

    // eslint-disable-next-line no-console
    console.error = jest.fn();

    const response = errorHandler(new Error("test message"));
    expect(expctedResponse.statusCode).toEqual(response.statusCode);
    expect(expctedResponse.body).toEqual(response.body);
    expect(expctedResponse.headers).toEqual(response.headers);
    // eslint-disable-next-line no-console
    expect(console.error).toBeCalled();
  });
});

describe("http request handler", () => {
  test("test basic flow - http Request Handler ", async () => {
    const event = {
      version: "2.0",
      routeKey: "$default",
      rawPath: "/",
      rawQueryString: "",
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br",
        authorization: "allow",
        "cache-control": "no-cache",
        "content-length": "61",
        "content-type": "application/json",
        host: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com"
      },
      requestContext: {
        accountId: "045615063699",
        apiId: "ee4v0vghuj",
        authorizer: { lambda: { fromAuthorizerKey: "fromAuthorizerVal" } },
        domainName: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com",
        domainPrefix: "ee4v0vghuj",
        http: {
          method: "POST",
          path: "/",
          protocol: "HTTP/1.1",
          sourceIp: "106.200.209.107",
          userAgent:
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
        },
        requestId: "NQ9lThTZBcwEMLA=",
        routeKey: "$default",
        stage: "$default",
        time: "09/Feb/2022:08:06:57 +0000",
        timeEpoch: 1644394017788
      },
      body: '{"intcheck": 123456, "boolcheck": true, "stringcheck": "str"}',
      isBase64Encoded: false
    };

    const lambdaFn: LambdaCallbackType = () => {
      return new Promise(resolve => {
        return resolve("test string");
      });
    };
    const exptRespose: HttpResponse = {
      body: "test string",
      headers: {
        "content-type": "text/plain"
      },
      statusCode: 200
    };
    const response = await httpResolver(event, lambdaFn);
    expect(exptRespose).toEqual(response);
  });
});
