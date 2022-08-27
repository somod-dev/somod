import {
  JSONArrayType,
  JSONObjectNode,
  parseJson
} from "../../../src/utils/jsonTemplate";
import { keywordIf } from "../../../src/utils/keywords/if";

describe("Test if keyword", () => {
  const getValidator = () => keywordIf.getValidator("", "", {});
  const getProcessor = () => keywordIf.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordIf.keyword).toEqual("SOMOD::If");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: [],
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error("Object with SOMOD::If must not have additional properties"),
      new Error(
        "SOMOD::If value must be array matching [Condition, ValueIfTrue, ValueIfFalse]"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::If value must be array")]);
  });

  test("the validator with empty array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: []
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error(
        "SOMOD::If value must be array matching [Condition, ValueIfTrue, ValueIfFalse]"
      )
    ]);
  });

  test("the validator with one array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: [true]
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error(
        "SOMOD::If value must be array matching [Condition, ValueIfTrue, ValueIfFalse]"
      )
    ]);
  });

  test("the validator with two object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: [{}, true]
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the validator with three object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: [{}, true, false]
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the validator with multiple items in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordIf.keyword]: ["a", 1, true, false, null, {}]
    };

    expect(
      validator(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error(
        "SOMOD::If value must be array matching [Condition, ValueIfTrue, ValueIfFalse]"
      )
    ]);
  });

  test("the processor with false condition and no false value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordIf.keyword]: [false, {}]
    };

    expect(
      processor(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: undefined
    });
  });

  test("the processor with false condition and false value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordIf.keyword]: [false, {}, { a: 10 }]
    };

    expect(
      processor(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: { a: 10 }
    });
  });

  test("the processor with truthy condition", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordIf.keyword]: [{ p: 30 }, { x: 20 }, { a: 10 }]
    };

    expect(
      processor(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: { x: 20 }
    });
  });

  test("the processor with true condition", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordIf.keyword]: [true, { x: 20 }, { a: 10 }]
    };

    expect(
      processor(
        keywordIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordIf.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: { x: 20 }
    });
  });
});
