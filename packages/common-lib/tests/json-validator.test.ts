import { getAjv, getValidator, validate } from "../src/json-validator";
import Ajv from "ajv";

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

  test("validate with chain", () => {
    expect(() =>
      validate(
        null,
        "this is awesome",
        getValidator({ type: "string", maxLength: 5 }, getAjv())
      )
    ).toThrow("must NOT have more than 5 characters");
  });
});
