import { mockedFunction } from "../../../utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import {
  checkCustomResourceSchema,
  getDeclaredFunctionsWithExcludedLibraries,
  keywordFunction
} from "../../../../src/utils/serverless/keywords/function";
import { keywordRef } from "../../../../src/utils/serverless/keywords/ref";
import { join } from "path";
import { ServerlessTemplate } from "../../../../src/utils/serverless/types";
import { JSONObjectNode, JSONObjectType, JSONType } from "somod-types";
import { existsSync } from "fs";
import { listFiles } from "nodejs-file-utils";

jest.mock("nodejs-file-utils", () => {
  const original = jest.requireActual("nodejs-file-utils");
  return {
    __esModule: true,
    ...original,
    listFiles: jest.fn()
  };
});

jest.mock("fs", () => {
  const original = jest.requireActual("fs");
  return {
    __esModule: true,
    ...original,
    existsSync: jest.fn()
  };
});

type FunctionType = {
  type: string;
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

    mockedFunction(existsSync).mockReset();
    mockedFunction(existsSync).mockReturnValue(true);
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
        "Function function1 not found. Create the function under serverless/functions directory"
      )
    ]);
  });

  test("the getValidator is calling existsSync and skipping listFiles when existsSync returns false", async () => {
    mockedFunction(existsSync).mockReturnValue(false);
    await keywordFunction.getValidator("/root/dir", "m1", {});
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions")
    );
    expect(listFiles).toHaveBeenCalledTimes(0);
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

    const processor = await keywordFunction.getProcessor(
      "/root/dir",
      "m1",
      allModules
    );

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
      value: "/root/dir/.somod/serverless/functions/m1/func1"
    });
  });
});

describe("Test util getDeclaredFunctions in keyword function", () => {
  test("for a complete template", () => {
    expect(
      getDeclaredFunctionsWithExcludedLibraries("m1", {
        m1: {
          module: "m1",
          packageLocation: "",
          template: {
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
                      name: "func2"
                    } as FunctionType
                  }
                }
              },
              L1: {
                Type: "AWS::Serverless::LayerVersion",
                Properties: {
                  ContentUri: {
                    "SOMOD::FunctionLayer": {
                      name: "layer1",
                      libraries: ["l1", "l2", "l3"],
                      content: { "/a/b/c": "123" }
                    }
                  }
                }
              },
              R3: {
                Type: "AWS::Serverless::Function",
                Properties: {
                  CodeUri: {
                    [keywordFunction.keyword]: {
                      name: "func3"
                    } as FunctionType
                  },
                  Layers: [
                    {
                      "SOMOD::Ref": {
                        resource: "L1"
                      }
                    }
                  ]
                }
              },
              R4: {
                Type: "AWS::Serverless::Function",
                Properties: {
                  CodeUri: {
                    [keywordFunction.keyword]: {
                      name: "func4"
                    } as FunctionType
                  },
                  Layers: [
                    {
                      "SOMOD::Ref": {
                        resource: "L2",
                        module: "m2"
                      }
                    }
                  ]
                }
              },
              R5: {
                Type: "AWS::Serverless::Function",
                Properties: {
                  CodeUri: {
                    [keywordFunction.keyword]: {
                      name: "func5"
                    } as FunctionType
                  },
                  Layers: [
                    {
                      "SOMOD::Ref": {
                        resource: "L1",
                        module: "m1"
                      }
                    },
                    {
                      "SOMOD::Ref": {
                        resource: "L2",
                        module: "m2"
                      }
                    }
                  ]
                }
              },
              R6: {
                Type: "SomeType",
                Properties: {
                  CodeUri: {
                    [keywordFunction.keyword]: {
                      name: "func5"
                    } as FunctionType
                  }
                }
              }
            }
          }
        },
        m2: {
          module: "m2",
          packageLocation: "",
          template: {
            Resources: {
              L2: {
                Type: "AWS::Serverless::LayerVersion",
                Properties: {
                  ContentUri: {
                    "SOMOD::FunctionLayer": {
                      name: "layer1",
                      libraries: ["l3", "l4"]
                    }
                  }
                }
              }
            }
          }
        }
      })
    ).toEqual([
      { name: "func1", exclude: ["aws-sdk"] },
      { name: "func2", exclude: ["aws-sdk"] },
      { name: "func3", exclude: ["aws-sdk", "l1", "l2", "l3"] },
      { name: "func4", exclude: ["aws-sdk", "l3", "l4"] },
      { name: "func5", exclude: ["aws-sdk", "l1", "l2", "l3", "l4"] }
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
              type: "CFNCustomResource",
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

  test("for a reference other than Service Token", async () => {
    await expect(
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
    ).resolves.toEqual([]);
  });

  test("for missing schema", async () => {
    await expect(
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
    ).resolves.toEqual([
      new Error(
        "Unable to find the schema for the custom resource R2. The custom resource function CFNLambda must define the schema for the custom resource."
      )
    ]);
  });

  test("for schema validation failure", async () => {
    await expect(
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
    ).resolves.toEqual([
      new Error(
        `Custom Resource R2Resource has following validation errors\nmust have required property 'P1'`
      )
    ]);
  });

  test("for right schema", async () => {
    await expect(
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
    ).resolves.toEqual([]);
  });
});
