import { JSONArrayType, JSONObjectNode } from "somod-types";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { keywordEquals } from "../../../src/utils/keywords/equals";

describe("Test equals keyword", () => {
  const getValidator = () => keywordEquals.getValidator("", "", null, null);
  const getProcessor = () => keywordEquals.getProcessor("", "", null, null);

  test("the keyword name", () => {
    expect(keywordEquals.keyword).toEqual("SOMOD::Equals");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordEquals.keyword]: [],
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::Equals must not have additional properties"
      ),
      new Error("SOMOD::Equals value must be array matching [Value1, Value2]")
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordEquals.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual([new Error("SOMOD::Equals value must be array")]);
  });

  test("the validator with empty array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordEquals.keyword]: []
    };

    expect(
      validator(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error("SOMOD::Equals value must be array matching [Value1, Value2]")
    ]);
  });

  test("the validator with two object in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordEquals.keyword]: [{}, true]
    };

    expect(
      validator(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual([]);
  });

  test("the validator with multiple items in array value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordEquals.keyword]: ["a", 1, true, false, null, {}]
    };

    expect(
      validator(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual([
      new Error("SOMOD::Equals value must be array matching [Value1, Value2]")
    ]);
  });

  test("the processor with two unequal value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordEquals.keyword]: [false, {}]
    };

    expect(
      processor(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: false
    });
  });

  test("the processor with two equal values in array value", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordEquals.keyword]: [{ a: 20 }, { a: 20 }]
    };

    expect(
      processor(
        keywordEquals.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordEquals.keyword] as unknown as JSONArrayType
      )
    ).toEqual({
      type: "object",
      value: true
    });
  });
});
