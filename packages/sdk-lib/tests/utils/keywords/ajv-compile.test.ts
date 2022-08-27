import {
  JSONObjectNode,
  JSONObjectType,
  parseJson
} from "../../../src/utils/jsonTemplate";
import { keywordAjvCompile } from "../../../src/utils/keywords/ajv-compile";

describe("Test ajv-compile keyword", () => {
  const getValidator = () => keywordAjvCompile.getValidator("", "", {});
  const getProcessor = () => keywordAjvCompile.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordAjvCompile.keyword).toEqual("SOMOD::AjvCompile");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAjvCompile.keyword]: {},
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordAjvCompile.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAjvCompile.keyword]
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::AjvCompile must not have additional properties"
      )
    ]);
  });

  test("the validator with string value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAjvCompile.keyword]: "samplestring"
    };

    expect(
      validator(
        keywordAjvCompile.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAjvCompile.keyword] as unknown as JSONObjectType
      )
    ).toEqual([]);
  });

  test("the validator with object value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAjvCompile.keyword]: {}
    };

    expect(
      validator(
        keywordAjvCompile.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAjvCompile.keyword]
      )
    ).toEqual([]);
  });

  test("the processor with invalid schema", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordAjvCompile.keyword]: "this is invalid schema"
    };

    expect(() =>
      processor(
        keywordAjvCompile.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAjvCompile.keyword] as unknown as JSONObjectType
      )
    ).toThrow("schema must be object or boolean");
  });

  test("the processor with valid schema", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordAjvCompile.keyword]: { type: "object" }
    };

    expect(
      processor(
        keywordAjvCompile.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAjvCompile.keyword] as unknown as JSONObjectType
      )
    ).toMatchInlineSnapshot(`
      Object {
        "type": "object",
        "value": "\\"use strict\\";module.exports = validate14;module.exports.default = validate14;const schema16 = {\\"type\\":\\"object\\"};function validate14(data, {instancePath=\\"\\", parentData, parentDataProperty, rootData=data}={}){let vErrors = null;let errors = 0;if(!(data && typeof data == \\"object\\" && !Array.isArray(data))){const err0 = {instancePath,schemaPath:\\"#/type\\",keyword:\\"type\\",params:{type: \\"object\\"},message:\\"must be object\\"};if(vErrors === null){vErrors = [err0];}else {vErrors.push(err0);}errors++;}validate14.errors = vErrors;return errors === 0;}",
      }
    `);
  });
});
