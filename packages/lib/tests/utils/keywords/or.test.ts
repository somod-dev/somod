import { JSONArrayType, JSONObjectNode } from "somod-types";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { keywordOr } from "../../../src/utils/keywords/or";

describe("Test or keyword", () => {
  const getValidator = () => keywordOr.getValidator("", "", {});
  const getProcessor = () => keywordOr.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordOr.keyword).toEqual("SOMOD::Or");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOr.keyword]: [],
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error("Object with SOMOD::Or must not have additional properties"),
      new Error("SOMOD::Or value must contain atleast 1 value")
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOr.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::Or value must be array")]);
  });

  test("the validator with empty array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOr.keyword]: []
    };

    expect(
      validator(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::Or value must contain atleast 1 value")]);
  });

  test("the validator with one object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOr.keyword]: [{}]
    };

    expect(
      validator(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the validator with multiple items in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOr.keyword]: ["a", 1, true, false, null, {}]
    };

    expect(
      validator(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the processor with one value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordOr.keyword]: [false]
    };

    expect(
      processor(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: false
    });
  });

  test("the processor with one object in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordOr.keyword]: [{}]
    };

    expect(
      processor(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: true
    });
  });

  test("the processor with multiple items in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordOr.keyword]: ["", 0, false]
    };

    expect(
      processor(
        keywordOr.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOr.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: false
    });
  });
});
