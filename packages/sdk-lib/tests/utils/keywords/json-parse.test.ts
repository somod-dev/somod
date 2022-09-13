import { JSONObjectNode } from "somod-types";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { keywordJsonParse } from "../../../src/utils/keywords/json-parse";

describe("Test json-parse keyword", () => {
  const getValidator = () => keywordJsonParse.getValidator("", "", {});
  const getProcessor = () => keywordJsonParse.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordJsonParse.keyword).toEqual("SOMOD::JsonParse");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonParse.keyword]: "",
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordJsonParse.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonParse.keyword]
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::JsonParse must not have additional properties"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonParse.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordJsonParse.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonParse.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with object value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonParse.keyword]: {}
    };

    expect(
      validator(
        keywordJsonParse.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonParse.keyword] as unknown as string
      )
    ).toEqual([]);
  });

  test("the processor with invalid string", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordJsonParse.keyword]: "this is invalid json"
    };

    expect(() =>
      processor(
        keywordJsonParse.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonParse.keyword]
      )
    ).toThrow("Unexpected token h in JSON at position 1");
  });

  test("the processor with valid json", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordJsonParse.keyword]:
        '{"name": "raaghu", "email": "raaghu@example.com"}'
    };

    expect(
      processor(
        keywordJsonParse.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonParse.keyword]
      )
    ).toEqual({
      type: "object",
      value: {
        name: "raaghu",
        email: "raaghu@example.com"
      }
    });
  });
});
