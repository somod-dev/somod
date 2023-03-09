import { JSONArrayType, JSONObjectNode } from "somod-types";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { keywordAnd } from "../../../src/utils/keywords/and";

describe("Test and keyword", () => {
  const getValidator = () => keywordAnd.getValidator("", null);
  const getProcessor = () => keywordAnd.getProcessor("", null);

  test("the keyword name", () => {
    expect(keywordAnd.keyword).toEqual("SOMOD::And");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAnd.keyword]: [],
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error("Object with SOMOD::And must not have additional properties"),
      new Error("SOMOD::And value must contain atleast 1 value")
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAnd.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::And value must be array")]);
  });

  test("the validator with empty array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAnd.keyword]: []
    };

    expect(
      validator(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::And value must contain atleast 1 value")]);
  });

  test("the validator with one object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAnd.keyword]: [{}]
    };

    expect(
      validator(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the validator with multiple items in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAnd.keyword]: ["a", 1, true, false, null, {}]
    };

    expect(
      validator(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the processor with one value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordAnd.keyword]: [false]
    };

    expect(
      processor(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: false
    });
  });

  test("the processor with one object in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordAnd.keyword]: [{}]
    };

    expect(
      processor(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: true
    });
  });

  test("the processor with multiple items in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordAnd.keyword]: ["a", 1, true, {}]
    };

    expect(
      processor(
        keywordAnd.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAnd.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: true
    });
  });
});
