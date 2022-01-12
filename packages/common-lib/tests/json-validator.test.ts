import { getAjv, getValidator, validate } from "../src/json-validator";
import Ajv from "ajv";
import { JSONSchema7 } from "json-schema";
import { DataValidationError } from "../src/errors";

describe("Test JSON Validator", () => {
  test("getAjv", () => {
    const ajv = getAjv();
    expect(ajv).toBeInstanceOf(Ajv);
    expect(Object.keys(ajv.formats)).toEqual([
      "date",
      "time",
      "date-time",
      "duration",
      "uri",
      "uri-reference",
      "uri-template",
      "url",
      "email",
      "hostname",
      "ipv4",
      "ipv6",
      "regex",
      "uuid",
      "json-pointer",
      "json-pointer-uri-fragment",
      "relative-json-pointer",
      "byte",
      "int32",
      "int64",
      "float",
      "double",
      "password",
      "binary"
    ]);
  });

  test("getValidator", () => {
    const validate = getValidator({ type: "string" });
    expect(typeof validate).toEqual("function");
  });

  test("validate", () => {
    expect(validate({ type: "string" }, "this is awesome")).toBeUndefined();
  });

  test("validate for error", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        a: {
          oneOf: [
            {
              type: "object",
              properties: {
                type: { const: "type1" },
                name: { type: "string" }
              }
            },
            {
              type: "object",
              properties: {
                type: { const: "type2" },
                label: { type: "string" }
              }
            },
            {
              type: "string"
            }
          ]
        }
      }
    };

    const data = { a: { type: "mykey" } };
    let error = null;
    try {
      validate(schema, data, null, "my-module");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(DataValidationError);
    expect(error.message).toEqual(
      "DataValidationError<my-module>: 'type' property must be equal to the allowed value"
    );
    expect(error.context).toEqual({
      allowedValue: "type1",
      errorType: "const"
    });
    expect(error.path).toEqual("{base}.a.type");
  });

  test("validate with chain", () => {
    expect(() =>
      validate(
        null,
        "this is awesome",
        getValidator({ type: "string", maxLength: 5 }, getAjv())
      )
    ).toThrow(
      "DataValidationError<>: {base} must not have more than 5 characters"
    );
  });
});
