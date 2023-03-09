import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode
} from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordResourceName } from "../../../../src/utils/serverless/keywords/resourceName";

describe("Test resourceName keyword", () => {
  const getValidator = () => keywordResourceName.getValidator("", null);
  const getProcessor = () =>
    keywordResourceName.getProcessor("m1", {
      serverlessTemplateHandler: {
        getSAMResourceName: (m, r) => `${m}--${r}`
      } as IServerlessTemplateHandler
    } as IContext);

  test("the keyword name", () => {
    expect(keywordResourceName.keyword).toEqual("SOMOD::ResourceName");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordResourceName.keyword]: "myresource",
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordResourceName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordResourceName.keyword]
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::ResourceName must not have additional properties"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordResourceName.keyword]: "myresource"
    };

    expect(
      validator(
        keywordResourceName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordResourceName.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with non string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordResourceName.keyword]: {}
    };

    expect(
      validator(
        keywordResourceName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordResourceName.keyword] as unknown as string
      )
    ).toEqual([new Error("SOMOD::ResourceName value must be string")]);
  });

  test("the processor", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordResourceName.keyword]: "myresource"
    };

    expect(
      processor(
        keywordResourceName.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordResourceName.keyword]
      )
    ).toMatchInlineSnapshot(`
      Object {
        "type": "object",
        "value": "m1--myresource",
      }
    `);
  });
});
