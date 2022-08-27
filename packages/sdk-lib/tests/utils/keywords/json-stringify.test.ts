import { JSONObjectNode, parseJson } from "../../../src/utils/jsonTemplate";
import { keywordJsonStringify } from "../../../src/utils/keywords/json-stringify";

describe("Test json-stringify keyword", () => {
  const getValidator = () => keywordJsonStringify.getValidator("", "", {});
  const getProcessor = () => keywordJsonStringify.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordJsonStringify.keyword).toEqual("SOMOD::JsonStringify");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonStringify.keyword]: "",
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordJsonStringify.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonStringify.keyword]
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::JsonStringify must not have additional properties"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonStringify.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordJsonStringify.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonStringify.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with object value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordJsonStringify.keyword]: {}
    };

    expect(
      validator(
        keywordJsonStringify.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonStringify.keyword] as unknown as string
      )
    ).toEqual([]);
  });

  test("the processor with valid object", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordJsonStringify.keyword]: {
        name: "raaghu",
        email: "raaghu@example.com"
      }
    };

    expect(
      processor(
        keywordJsonStringify.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordJsonStringify.keyword]
      )
    ).toEqual({
      type: "object",
      value: '{"name":"raaghu","email":"raaghu@example.com"}'
    });
  });
});
