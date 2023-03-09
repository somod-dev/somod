import { JSONObjectNode } from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordCreateIf } from "../../../../src/utils/serverless/keywords/createIf";

describe("Test createIf keyword", () => {
  const getValidator = () => keywordCreateIf.getValidator("", null);
  const getProcessor = () => keywordCreateIf.getProcessor("", null);

  test("the keyword name", () => {
    expect(keywordCreateIf.keyword).toEqual("SOMOD::CreateIf");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordCreateIf.keyword]: false
    };

    expect(
      validator(
        keywordCreateIf.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordCreateIf.keyword]
      )
    ).toEqual([
      new Error("SOMOD::CreateIf is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordCreateIf.keyword]: true
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordCreateIf.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[keywordCreateIf.keyword]
      )
    ).toEqual([
      new Error("SOMOD::CreateIf is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordCreateIf.keyword]: {},
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordCreateIf.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordCreateIf.keyword] as boolean
      )
    ).toEqual([]);
  });

  test("the processor with value true", async () => {
    const processor = await getProcessor();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordCreateIf.keyword]: true,
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordCreateIf.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordCreateIf.keyword] as boolean
      )
    ).toEqual({ type: "keyword", value: {} });
  });

  test("the processor with value false", async () => {
    const processor = await getProcessor();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordCreateIf.keyword]: false,
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordCreateIf.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordCreateIf.keyword] as boolean
      )
    ).toEqual({ type: "object", value: undefined });
  });
});
