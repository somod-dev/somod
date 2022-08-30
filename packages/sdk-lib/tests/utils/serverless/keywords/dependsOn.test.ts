import { mockedFunction } from "@sodev/test-utils";
import { JSONObjectNode, parseJson } from "../../../../src/utils/jsonTemplate";
import { checkAccess } from "../../../../src/utils/serverless/keywords/access";
import { keywordDependsOn } from "../../../../src/utils/serverless/keywords/dependsOn";

jest.mock("../../../../src/utils/serverless/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn().mockResolvedValue([])
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
    const validator = await keywordDependsOn.getValidator("", "m1", {});

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
    const validator = await keywordDependsOn.getValidator("", "m1", {});

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
    const validator = await keywordDependsOn.getValidator("", "m1", {});

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

  test("the validator with non existing dependency", async () => {
    const validator = await keywordDependsOn.getValidator("", "m1", {
      m2: { moduleName: "m2", location: "", path: "", json: { Resources: {} } }
    });

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [{ module: "m3", resource: "r1" }],
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
    ).toEqual([new Error("Dependent module resource {m3, r1} not found.")]);
  });

  test("the validator with existing dependency", async () => {
    const validator = await keywordDependsOn.getValidator("", "m1", {
      m2: {
        moduleName: "m2",
        location: "",
        path: "",
        json: { Resources: { r1: { Type: "MyType", Properties: {} } } }
      }
    });

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordDependsOn.keyword]: [{ module: "m2", resource: "r1" }],
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
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
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
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: { Resources: { resource1: { Type: "MyType", Properties: {} } } }
      },
      m2: {
        moduleName: "m2",
        location: "",
        path: "",
        json: { Resources: { r1: { Type: "MyType", Properties: {} } } }
      }
    };
    const validator = await keywordDependsOn.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([]);

    expect(checkAccess).toHaveBeenCalledTimes(2);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      "m0",
      allModules.m1,
      "resource1"
    );
    expect(checkAccess).toHaveBeenNthCalledWith(2, "m0", allModules.m2, "r1");
  });

  test("the validator piping the errors from checkAccess", async () => {
    mockedFunction(checkAccess).mockReturnValue([
      new Error("Error from CheckAccess")
    ]);
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
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
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: { Resources: { resource1: { Type: "MyType", Properties: {} } } }
      },
      m2: {
        moduleName: "m2",
        location: "",
        path: "",
        json: { Resources: { r1: { Type: "MyType", Properties: {} } } }
      }
    };
    const validator = await keywordDependsOn.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordDependsOn.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordDependsOn.keyword] as {
          resource: string;
        }[]
      )
    ).toEqual([
      new Error("Error from CheckAccess"),
      new Error("Error from CheckAccess")
    ]);
  });

  test("the processor", async () => {
    const processor = await keywordDependsOn.getProcessor("", "m0", {});

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
        DependsOn: ["rca0df2c9resource1", "r29c1b289r1"]
      }
    });
  });
});
