import { mockedFunction } from "@sodev/test-utils";
import { JSONObjectNode } from "@somod/types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { checkAccess } from "../../../../src/utils/serverless/keywords/access";
import { keywordExtend } from "../../../../src/utils/serverless/keywords/extend";

jest.mock("../../../../src/utils/serverless/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn().mockResolvedValue([])
  };
});

describe("Test extend keyword", () => {
  beforeEach(() => {
    mockedFunction(checkAccess).mockReset();
  });

  test("the keyword name", () => {
    expect(keywordExtend.keyword).toEqual("SOMOD::Extend");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordExtend.getValidator("", "m1", {});

    const obj = {
      [keywordExtend.keyword]: {}
    };

    expect(
      validator(
        keywordExtend.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordExtend.keyword] as { module: string; resource: string }
      )
    ).toEqual([
      new Error("SOMOD::Extend is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordExtend.getValidator("", "m1", {});

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordExtend.keyword]: {}
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([
      new Error("SOMOD::Extend is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
          Resources: {
            MyResource1: {
              Type: "Custom::MyCustomType",
              [keywordExtend.keyword]: { module: "m1", resource: "r1" },
              Properties: {}
            }
          }
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: {
          Resources: { r1: { Type: "Custom::MyCustomType", Properties: {} } }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([]);
  });

  test("the validator with extending resource in same module", async () => {
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
          Resources: {
            MyResource1: {
              Type: "Custom::MyCustomType",
              [keywordExtend.keyword]: {
                module: "m0",
                resource: "MyResource2"
              },
              Properties: {}
            },
            MyResource2: {
              Type: "Custom::MyCustomType",
              Properties: {}
            }
          }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([
      new Error(
        "Can not extend the resource MyResource2 in the same module m0. Edit the resource directly"
      )
    ]);
  });

  test("the validator with extending different type of resource", async () => {
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
          Resources: {
            MyResource1: {
              Type: "Custom::MyCustomType",
              [keywordExtend.keyword]: { module: "m1", resource: "r1" },
              Properties: {}
            }
          }
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: {
          Resources: { r1: { Type: "AnotherType", Properties: {} } }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([
      new Error(
        "Can extend only same type of resource. Custom::MyCustomType can not extend AnotherType"
      )
    ]);
  });

  test("the validator with extending non existing resource", async () => {
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
          Resources: {
            MyResource1: {
              Type: "Custom::MyCustomType",
              [keywordExtend.keyword]: { module: "m3", resource: "r1" },
              Properties: {}
            }
          }
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: {
          Resources: { r1: { Type: "Custom::MyCustomType", Properties: {} } }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([new Error("Extended module resource {m3, r1} not found.")]);
  });

  test("the validator calling checkAccess for extended resource", async () => {
    const allModules = {
      m0: {
        moduleName: "m0",
        location: "",
        path: "",
        json: {
          Resources: {
            MyResource1: {
              Type: "Custom::MyCustomType",
              [keywordExtend.keyword]: { module: "m1", resource: "r1" },
              Properties: {}
            }
          }
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: {
          Resources: { r1: { Type: "Custom::MyCustomType", Properties: {} } }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(1, "m0", allModules.m1, "r1");
  });

  test("the validator piping the checkAccess errors", async () => {
    mockedFunction(checkAccess).mockReturnValue([
      new Error("Error from checkAccess")
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
              [keywordExtend.keyword]: { module: "m1", resource: "r1" },
              Properties: {}
            }
          }
        }
      },
      m1: {
        moduleName: "m1",
        location: "",
        path: "",
        json: {
          Resources: { r1: { Type: "Custom::MyCustomType", Properties: {} } }
        }
      }
    };

    const validator = await keywordExtend.getValidator("", "m0", allModules);

    const objNode = parseJson(allModules.m0.json) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        allModules.m0.json.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([new Error("Error from checkAccess")]);
  });

  test("the processor", async () => {
    const processor = await keywordExtend.getProcessor("", "m0", {});

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordExtend.keyword]: { module: "m1", resource: "r1" },
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual({
      type: "keyword",
      value: {
        [keywordExtend.keyword]: "rca0df2c9r1"
      }
    });
  });
});
