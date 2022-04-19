import { JSONSchema7 } from "json-schema";
import {
  getDefaultBodyValidator,
  getDefaultHeaderValidator,
  getDefaultPathParamsValidator,
  getDefaultQueryParamValidator
} from "../src/validator/inputValidator";
import { DataValidationError } from "@solib/errors";

describe("Validators", () => {
  test("Validate Header Params", () => {
    const headers = {
      accept: "*/*",
      authorization: "allow",
      "content-length": "61",
      "content-type": "application/json",
      host: "ee4v0vghuj.execute-api.ap-south-1.amazonaws.com",
      "user-agent": "curl/7.68.0",
      "x-amzn-trace-id": "Root=1-61fd0ca7-17ac68f2337229c33620af1b",
      "x-forwarded-for": "103.5.133.132",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https"
    };

    const schema: JSONSchema7 = {
      type: "object",
      patternProperties: {
        "^[ A-Za-z0-9_@./#&+-]*$": { type: "string" }
      }
    };
    const fnHeader = getDefaultHeaderValidator(schema);
    expect(fnHeader(headers)).toEqual(undefined);
  });

  test("Validate Header Params - negative", () => {
    const headers = {
      accept: "*/*",
      authorization: "allow",
      "content-type": "application/json"
    };

    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        accept: { type: "string" },
        authorization: { type: "string" },
        "content-type": { type: "number" },
        host: { type: "number" }
      }
    };
    let error = null;
    try {
      const fnHeader = getDefaultHeaderValidator(schema);
      fnHeader(headers);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(DataValidationError);
    expect(error.message).toEqual(
      "DataValidationError<>: 'content-type' property type must be number"
    );
  });

  test("Validate Header Params - negative", () => {
    const headers = {
      accept: "*/*",
      authorization: "allow",
      "content-type": "application/json"
    };

    const schema: JSONSchema7 = {
      type: "object",
      patternProperties: {
        "^S_": { type: "string" }
      },
      additionalProperties: false
    };

    let error = null;
    try {
      const fnHeader = getDefaultHeaderValidator(schema);
      fnHeader(headers);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(DataValidationError);
  });

  test("Validate Path Params", () => {
    const pathParameters = {
      parameter1: "value1"
    };

    const schema: JSONSchema7 = {
      type: "object"
    };
    const fnHeader = getDefaultPathParamsValidator(schema);
    expect(fnHeader(pathParameters)).toEqual(undefined);
  });

  test("Validate Path Params - negative", () => {
    const pathParameters = {
      parameter1: "value1"
    };

    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        parameter1: { type: "number" }
      }
    };
    const fnHeader = getDefaultPathParamsValidator(schema);

    expect(() => fnHeader(pathParameters)).toThrowError(
      "DataValidationError<>: 'parameter1' property type must be number"
    );
  });

  test("Validate Query Params", () => {
    const queryStringParameters = {
      parameter1: "value1,value2",
      parameter2: "value"
    };

    const schema: JSONSchema7 = {
      type: "object"
    };
    const fnQueryParam = getDefaultPathParamsValidator(schema);
    expect(fnQueryParam(queryStringParameters)).toEqual(undefined);
  });

  test("Validate Query Params - negative", () => {
    const queryStringParameters = {
      parameter1: "value1,value2"
    };

    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        parameter1: { type: "string" },
        parameter2: { type: "string" }
      },
      required: ["parameter1", "parameter2"]
    };
    const fnQueryParam = getDefaultQueryParamValidator(schema);
    let error = null;
    try {
      fnQueryParam(queryStringParameters);
    } catch (e) {
      error = e;
    }
    expect(error.message).toEqual(
      "DataValidationError<>: {base} must have required property 'parameter2'"
    );
  });

  test("Validate body", () => {
    const body = { bodyKey: "Hello from Lambda" };

    const schema: JSONSchema7 = {
      type: "object"
    };
    const fnBody = getDefaultBodyValidator(schema);
    expect(fnBody(body)).toEqual(undefined);
  });

  test("Validate body - negative", () => {
    const body = { bodyKey: "Hello from Lambda" };

    const schema: JSONSchema7 = {
      type: "string"
    };
    const fnBody = getDefaultBodyValidator(schema);

    let error = null;
    try {
      fnBody(body);
    } catch (e) {
      error = e;
    }
    expect(error.message).toEqual(
      "DataValidationError<>: '' property type must be string"
    );
  });
});
