import { mockedFunction } from "@sodev/test-utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { listFiles } from "@solib/cli-base";
import {
  checkCustomResourceSchema,
  getDeclaredFunctions,
  keywordFunction
} from "../../../../src/utils/serverless/keywords/function";
import { keywordRef } from "../../../../src/utils/serverless/keywords/ref";
import { join } from "path";
import { ServerlessTemplate } from "../../../../src/utils/serverless/types";
import { JSONObjectNode, JSONObjectType, JSONType } from "@somod/types";

jest.mock("@solib/cli-base", () => {
  const original = jest.requireActual("@solib/cli-base");
  return {
    __esModule: true,
    ...original,
    listFiles: jest.fn()
  };
});

type FunctionType = {
  name: string;
  exclude?: string[];
  customResources?: JSONObjectType;
};

describe("Test function keyword", () => {
  beforeEach(() => {
    mockedFunction(listFiles).mockReset();
    mockedFunction(listFiles).mockResolvedValue([
      "func1.ts",
      "func2.ts",
      "func3.ts"
    ]);
  });

  test("the keyword name", () => {
    expect(keywordFunction.keyword).toEqual("SOMOD::Function");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordFunction.getValidator("", "m1", {});

    const obj = {
      [keywordFunction.keyword]: {}
    };

    expect(
      validator(
        keywordFunction.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordFunction.keyword] as FunctionType
      )
    ).toEqual([
      new Error(
        "SOMOD::Function is allowed only as value of CodeUri property of AWS::Serverless::Function resource"
      )
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordFunction.getValidator("", "m1", {});

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            [keywordFunction.keyword]: {}
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunction.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).toEqual([
      new Error(
        "SOMOD::Function is allowed only as value of CodeUri property of AWS::Serverless::Function resource"
      )
    ]);
  });

  test("the validator with at CodeUri Property", async () => {
    const validator = await keywordFunction.getValidator("", "m1", {});

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: { name: "func1" }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).toEqual([]);
  });

  test("the validator with non existing function", async () => {
    const validator = await keywordFunction.getValidator("", "m1", {});

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: { name: "function1" }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).toEqual([
      new Error(
        "Function function1 not found. define under serverless/functions"
      )
    ]);
  });

  test("the getValidator is calling listFiles", async () => {
    await keywordFunction.getValidator("/root/dir", "m1", {});
    expect(listFiles).toHaveBeenCalledTimes(1);
    expect(listFiles).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions")
    );
  });

  test("the processor", async () => {
    const allModules = {
      m1: {
        moduleName: "m1",
        location: "/a/b/c",
        path: "serverless/template.yaml",
        json: {
          Resources: {
            MyResource1: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: {
                  [keywordFunction.keyword]: { name: "func1" }
                }
              }
            }
          }
        }
      }
    };

    const processor = await keywordFunction.getProcessor("", "m1", allModules);

    const objNode = parseJson(allModules.m1.json) as JSONObjectNode;

    expect(
      processor(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        allModules.m1.json.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).toEqual({
      type: "object",
      value: "/a/b/c/build/serverless/functions/func1"
    });
  });
});

describe("Test util getDeclaredFunctions in keyword function", () => {
  test("for a complete template", () => {
    expect(
      getDeclaredFunctions({
        Resources: {
          R1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                [keywordFunction.keyword]: {
                  name: "func1"
                } as FunctionType
              }
            }
          },
          R2: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                [keywordFunction.keyword]: {
                  name: "func2",
                  exclude: []
                } as FunctionType
              }
            }
          },
          R3: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                [keywordFunction.keyword]: {
                  name: "func3",
                  exclude: ["l1", "l2", "l3"]
                } as FunctionType
              }
            }
          },
          R4: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                [keywordFunction.keyword]: {
                  name: "func4",
                  exclude: ["l3", "l4"]
                } as FunctionType
              }
            }
          }
        }
      })
    ).toEqual([
      { name: "func1", exclude: [] },
      { name: "func2", exclude: [] },
      { name: "func3", exclude: ["l1", "l2", "l3"] },
      { name: "func4", exclude: ["l3", "l4"] }
    ]);
  });
});

describe("Test util checkCustomResourceSchema in keyword function", () => {
  const template1: ServerlessTemplate = {
    Resources: {
      CFNLambda: {
        Type: "AWS::Serverless::Function",
        Properties: {
          CodeUri: {
            [keywordFunction.keyword]: {
              name: "cfnLambda",
              customResources: {
                R1: {
                  type: "object",
                  additionalProperties: false,
                  required: ["P1"],
                  properties: {
                    P1: { type: "string" }
                  }
                }
              }
            } as FunctionType
          }
        }
      }
    }
  };

  const template2: ServerlessTemplate = {
    Resources: {
      Resource1: {
        Type: "MyType",
        Properties: {
          MyProp: {
            [keywordRef.keyword]: {
              resource: "CFNLambda"
            }
          }
        }
      },
      R1Resource: {
        Type: "Custom::R2",
        Properties: {
          ServiceToken: {
            [keywordRef.keyword]: {
              resource: "CFNLambda"
            }
          }
        }
      },
      R2Resource: {
        Type: "Custom::R1",
        Properties: {
          ServiceToken: {
            [keywordRef.keyword]: {
              resource: "CFNLambda"
            }
          }
        }
      },
      R3Resource: {
        Type: "Custom::R1",
        Properties: {
          ServiceToken: {
            [keywordRef.keyword]: {
              resource: "CFNLambda"
            }
          },
          P1: "waw"
        }
      }
    }
  };

  const template2Node = parseJson(template2 as JSONType);

  test("for a reference other than Service Token", () => {
    expect(
      checkCustomResourceSchema(
        (
          (
            (
              (template2Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["Resource1"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["MyProp"] as JSONObjectNode,
        {
          moduleName: "m1",
          location: "",
          path: "",
          json: template1
        },
        "CFNLambda"
      )
    ).toEqual([]);
  });

  test("for missing schema", () => {
    expect(
      checkCustomResourceSchema(
        (
          (
            (
              (template2Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R1Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode,
        {
          moduleName: "m1",
          location: "",
          path: "",
          json: template1
        },
        "CFNLambda"
      )
    ).toEqual([
      new Error(
        "Unable to find the schema for the custom resource R2. The custom resource function CFNLambda must define the schema for the custom resource."
      )
    ]);
  });

  test("for schema validation failure", () => {
    expect(
      checkCustomResourceSchema(
        (
          (
            (
              (template2Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R2Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode,
        {
          moduleName: "m1",
          location: "",
          path: "",
          json: template1
        },
        "CFNLambda"
      )
    ).toEqual([
      new Error(
        `Custom Resource R2Resource has following validation errors\nmust have required property 'P1'`
      )
    ]);
  });

  test("for right schema", () => {
    expect(
      checkCustomResourceSchema(
        (
          (
            (
              (template2Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R3Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode,
        {
          moduleName: "m1",
          location: "",
          path: "",
          json: template1
        },
        "CFNLambda"
      )
    ).toEqual([]);
  });
});
