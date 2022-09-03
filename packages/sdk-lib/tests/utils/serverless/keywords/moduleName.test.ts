import { JSONObjectNode } from "@somod/types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordModuleName } from "../../../../src/utils/serverless/keywords/moduleName";

describe("Test moduleName keyword", () => {
  const getValidator = () => keywordModuleName.getValidator("", "", {});
  const getProcessor = () => keywordModuleName.getProcessor("", "m1", {});

  test("the keyword name", () => {
    expect(keywordModuleName.keyword).toEqual("SOMOD::ModuleName");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordModuleName.keyword]: true,
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordModuleName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordModuleName.keyword] as boolean
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::ModuleName must not have additional properties"
      )
    ]);
  });

  test("the validator with boolean value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordModuleName.keyword]: true
    };

    expect(
      validator(
        keywordModuleName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordModuleName.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with non boolean value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordModuleName.keyword]: {}
    };

    expect(
      validator(
        keywordModuleName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordModuleName.keyword] as unknown as boolean
      )
    ).toEqual([new Error("SOMOD::ModuleName value must equal to true")]);
  });

  test("the processor", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordModuleName.keyword]: true
    };

    expect(
      processor(
        keywordModuleName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordModuleName.keyword]
      )
    ).toEqual({ type: "object", value: "m1" });
  });
});
