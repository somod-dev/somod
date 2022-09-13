import { JSONArrayType, JSONObjectNode, JSONObjectType } from "somod-types";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { keywordKey } from "../../../src/utils/keywords/key";

type ValueType = [JSONObjectType | JSONArrayType, string | number];

describe("Test key keyword", () => {
  const getValidator = () => keywordKey.getValidator("", "", {});
  const getProcessor = () => keywordKey.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordKey.keyword).toEqual("SOMOD::Key");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordKey.keyword]: [],
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual([
      new Error("Object with SOMOD::Key must not have additional properties"),
      new Error(
        "SOMOD::Key value must be array matching [ArrayOrObject, IndexOrPropertyName]"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordKey.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual([new Error("SOMOD::Key value must be array")]);
  });

  test("the validator with empty array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordKey.keyword]: []
    };

    expect(
      validator(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual([
      new Error(
        "SOMOD::Key value must be array matching [ArrayOrObject, IndexOrPropertyName]"
      )
    ]);
  });

  test("the validator with two object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordKey.keyword]: [{}, {}]
    };

    expect(
      validator(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual([]);
  });

  test("the validator with multiple items in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordKey.keyword]: ["a", 1, true, false, null, {}]
    };

    expect(
      validator(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual([
      new Error(
        "SOMOD::Key value must be array matching [ArrayOrObject, IndexOrPropertyName]"
      )
    ]);
  });

  test("the processor with invalid values", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordKey.keyword]: [false, {}]
    };

    expect(
      processor(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual({
      type: "object",
      value: undefined
    });
  });

  test("the processor with object and string in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordKey.keyword]: [{ a: 20 }, "a"]
    };

    expect(
      processor(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual({
      type: "object",
      value: 20
    });
  });

  test("the processor with array and number in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordKey.keyword]: [[{ a: 20 }, "200"], 1]
    };

    expect(
      processor(
        keywordKey.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordKey.keyword] as unknown as ValueType
      )
    ).toEqual({
      type: "object",
      value: "200"
    });
  });
});
