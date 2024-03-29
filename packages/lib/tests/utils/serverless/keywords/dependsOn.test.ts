import { mockedFunction } from "../../../utils";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode
} from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { checkAccess } from "../../../../src/utils/serverless/keywords/access";
import { keywordDependsOn } from "../../../../src/utils/serverless/keywords/dependsOn";

jest.mock("../../../../src/utils/serverless/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn()
  };
});

describe("Test dependsOn keyword", () => {
  beforeEach(() => {
    mockedFunction(checkAccess).mockReset();
  });

  test("the keyword name", () => {
    expect(keywordDependsOn.keyword).toEqual("SOMOD::DependsOn");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordDependsOn.getValidator("", null);

    const obj = {
      [keywordDependsOn.keyword]: []
    };

    expect(
      validator(
        keywordDependsOn.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordDependsOn.keyword] as { resource: string }[]
      )
    ).toEqual([
      new Error("SOMOD::DependsOn is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordDependsOn.getValidator("", null);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordDependsOn.keyword]: []
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([
      new Error("SOMOD::DependsOn is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const validator = await keywordDependsOn.getValidator("", null);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [],
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([]);
  });

  test("the validator calling checkAccess for each depended resource", async () => {
    const validator = await keywordDependsOn.getValidator("m0", {
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          const map = {
            m1: { resource1: { resource: { Type: "MyType", Properties: {} } } },
            m2: { r1: { resource: { Type: "MyType", Properties: {} } } }
          };
          return map[m][r];
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [
            { module: "m1", resource: "resource1" },
            { module: "m2", resource: "r1" }
          ],
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([]);

    expect(checkAccess).toHaveBeenCalledTimes(2);
    expect(checkAccess).toHaveBeenCalledWith(
      { Type: "MyType", Properties: {} },
      "m1",
      "resource1",
      "m0",
      "Depended"
    );
    expect(checkAccess).toHaveBeenCalledWith(
      { Type: "MyType", Properties: {} },
      "m2",
      "r1",
      "m0",
      "Depended"
    );
  });

  test("the validator piping the errors from checkAccess", async () => {
    mockedFunction(checkAccess).mockImplementation(() => {
      throw new Error("Error from CheckAccess");
    });

    const validator = await keywordDependsOn.getValidator("m0", {
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          const map = {
            m1: { resource1: { resource: { Type: "MyType", Properties: {} } } },
            m2: { r1: { resource: { Type: "MyType", Properties: {} } } }
          };
          return map[m][r];
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [
            { module: "m1", resource: "resource1" },
            { module: "m2", resource: "r1" }
          ],
          Properties: {}
        }
      }
    };
    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([
      new Error("Error from CheckAccess"),
      new Error("Error from CheckAccess")
    ]);
  });

  test("the processor", async () => {
    const processor = await keywordDependsOn.getProcessor("", {
      serverlessTemplateHandler: {
        getSAMResourceLogicalId(moduleName, somodResourceId) {
          return moduleName + somodResourceId;
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [
            { module: "m1", resource: "resource1" },
            { module: "m2", resource: "r1" }
          ],
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual({
      type: "keyword",
      value: {
        DependsOn: ["m1resource1", "m2r1"]
      }
    });
  });
});
