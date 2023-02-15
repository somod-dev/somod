import { mockedFunction } from "../../../utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import {
  checkCustomResourceSchema,
  getDeclaredFunctions,
  keywordFunction
} from "../../../../src/utils/serverless/keywords/function";
import { keywordRef } from "../../../../src/utils/serverless/keywords/ref";
import { join } from "path";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONType,
  ServerlessResource,
  ServerlessTemplate
} from "somod-types";
import { existsSync } from "fs";
import { listFiles } from "nodejs-file-utils";
import {
  FunctionType,
  MergedFunctionResourceContainer
} from "../../../../src/utils/serverless/keywords/function-helper";

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

jest.mock("../../../../src/utils/serverless/keywords/function-helper", () => ({
  __esModule: true,
  MergedFunctionResourceContainer: {
    getFinalFunctionResource: jest.fn()
  }
}));

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
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

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
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

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
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

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
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

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

  test("the validator with non matching events", async () => {
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: { type: "Api", name: "func1" }
            },
            Events: {
              e1: {
                Type: "Api",
                Properties: {}
              },
              e2: {
                Type: "RestApi",
                Properties: {}
              }
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
        "All Events in the function 'func1' must match its type 'Api'. Unmatched events are e2."
      )
    ]);
  });

  test("the validator with all matching events", async () => {
    const validator = await keywordFunction.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: { type: "Api", name: "func1" }
            },
            Events: {
              e1: {
                Type: "Api",
                Properties: {}
              },
              e2: {
                Type: "Api",
                Properties: {}
              }
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

  test("the validator with invalid middlewares", async () => {
    const resources: Record<string, Record<string, ServerlessResource>> = {
      module1: {
        M1: {
          Type: "MyOrg::Serverless::Middleware",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["Api"]
              }
            }
          }
        },
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: {
                type: "Api",
                name: "func1",
                middlewares: [
                  { resource: "M1" },
                  { module: "module2", resource: "M2" }
                ]
              }
            }
          }
        }
      },
      module2: {
        M2: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["RestApi", "S3", "Api"]
              }
            }
          }
        }
      }
    };
    const validator = await keywordFunction.getValidator("module1", {
      dir: "",
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          return { resource: resources[m][r], propertySourceMap: {} };
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = { Resources: resources.module1 };

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
        "Middleware {module1, M1} used in the function func1 must be of type SOMOD::Serverless::FunctionMiddleware"
      )
    ]);
  });

  test("the validator with non matching middlewares", async () => {
    const resources: Record<string, Record<string, ServerlessResource>> = {
      module1: {
        M1: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["Api"]
              }
            }
          }
        },
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: {
                type: "Api",
                name: "func1",
                middlewares: [
                  { resource: "M1" },
                  { module: "module2", resource: "M2" }
                ]
              }
            }
          }
        }
      },
      module2: {
        M2: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          "SOMOD::Access": "public",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["RestApi", "S3"]
              }
            }
          }
        }
      }
    };
    const validator = await keywordFunction.getValidator("module1", {
      dir: "",
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          return { resource: resources[m][r] };
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = { Resources: resources.module1 };

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
        "All middlewares in the function 'func1' must be allowed for type 'Api'. Unmatched middlewares are module2.M2."
      )
    ]);
  });

  test("the validator with matching middlewares", async () => {
    const resources: Record<string, Record<string, ServerlessResource>> = {
      module1: {
        M1: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["Api"]
              }
            }
          }
        },
        MyResource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            CodeUri: {
              [keywordFunction.keyword]: {
                type: "Api",
                name: "func1",
                middlewares: [
                  { resource: "M1" },
                  { module: "module2", resource: "M2" }
                ]
              }
            }
          }
        }
      },
      module2: {
        M2: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          "SOMOD::Access": "public",
          Properties: {
            CodeUri: {
              "SOMOD::FunctionMiddleware": {
                allowedTypes: ["RestApi", "S3", "Api"]
              }
            }
          }
        }
      }
    };
    const validator = await keywordFunction.getValidator("module1", {
      dir: "",
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          return { resource: resources[m][r] };
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const obj = { Resources: resources["module1"] };

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

  test("the getValidator is calling existsSync and skipping listFiles when existsSync returns false", async () => {
    mockedFunction(existsSync).mockReturnValue(false);
    await keywordFunction.getValidator("m1", { dir: "/root/dir" } as IContext);
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions")
    );
    expect(listFiles).toHaveBeenCalledTimes(0);
  });

  test("the getValidator is calling listFiles", async () => {
    await keywordFunction.getValidator("m1", { dir: "/root/dir" } as IContext);
    expect(listFiles).toHaveBeenCalledTimes(1);
    expect(listFiles).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions")
    );
  });

  test("the processor with Extend keyword", async () => {
    const allModules = {
      m1: {
        template: {
          Resources: {
            MyResource1: {
              Type: "AWS::Serverless::Function",
              "SOMOD::Extend": { module: "m2", resource: "r2" },
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

    const processor = await keywordFunction.getProcessor("m1", {
      dir: "/root/dir"
    } as IContext);

    const objNode = parseJson(allModules.m1.template) as JSONObjectNode;

    await expect(
      processor(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        allModules.m1.template.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).resolves.toEqual({
      type: "keyword",
      value: { [keywordFunction.keyword]: { name: "func1" } }
    });
  });

  test("the processor without Extend keyword", async () => {
    const resources = {
      m1: {
        template: {
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

    mockedFunction(
      MergedFunctionResourceContainer.getFinalFunctionResource
    ).mockResolvedValue({
      code: { function: { module: "m1", name: "func1" }, middlewares: [] },
      resource: resources.m1.template.Resources.MyResource1
    });

    const processor = await keywordFunction.getProcessor("m1", {
      dir: "/root/dir"
    } as IContext);

    const objNode = parseJson(resources.m1.template) as JSONObjectNode;

    await expect(
      processor(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        resources.m1.template.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).resolves.toEqual({
      type: "object",
      value: {
        CodeUri: ".somod/serverless/functions/m1/func1"
      },
      level: 1
    });
  });

  test("the processor with function code extended and more properties", async () => {
    const resources = {
      m1: {
        Resources: {
          MyResource1: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: {
                [keywordFunction.keyword]: {
                  name: "func1",
                  middlewares: [{ resource: "M1" }]
                }
              }
            }
          }
        }
      }
    };

    mockedFunction(
      MergedFunctionResourceContainer.getFinalFunctionResource
    ).mockResolvedValue({
      code: { function: { module: "m2", name: "func2" }, middlewares: [] },
      resource: {
        Type: "AWS::Serverless::Function",
        Properties: {
          ...resources.m1.Resources.MyResource1.Properties,
          Environment: {
            Variables: { ENV1: "", ENV2: { "SOMOD::Parameter": "my.p1" } }
          },
          Layers: [
            {
              "SOMOD::Ref": {
                resource: "l1"
              }
            },
            {
              "SOMOD::Ref": {
                module: "m2",
                resource: "l2"
              }
            }
          ]
        }
      }
    });

    const processor = await keywordFunction.getProcessor("m1", {
      dir: "/root/dir",
      serverlessTemplateHandler: {
        getTemplate: m => resources[m],
        getResource: (m, r) => ({ resource: resources[m].json.Resources[r] })
      } as IServerlessTemplateHandler
    } as IContext);

    const objNode = parseJson(resources.m1) as JSONObjectNode;

    await expect(
      processor(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        resources.m1.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).resolves.toEqual({
      type: "object",
      value: {
        CodeUri: ".somod/serverless/functions/m2/func2",
        Environment: {
          Variables: { ENV1: "", ENV2: { "SOMOD::Parameter": "my.p1" } }
        },
        Layers: [
          {
            "SOMOD::Ref": {
              resource: "l1"
            }
          },
          {
            "SOMOD::Ref": {
              module: "m2",
              resource: "l2"
            }
          }
        ]
      },
      level: 1
    });
  });

  test("the processor with debug mode", async () => {
    const resources = {
      m1: {
        template: {
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

    mockedFunction(
      MergedFunctionResourceContainer.getFinalFunctionResource
    ).mockResolvedValue({
      code: { function: { module: "m1", name: "func1" }, middlewares: [] },
      resource: resources.m1.template.Resources.MyResource1
    });

    const processor = await keywordFunction.getProcessor("m1", {
      dir: "/root/dir",
      isDebugMode: true
    } as IContext);

    const objNode = parseJson(resources.m1.template) as JSONObjectNode;

    await expect(
      processor(
        keywordFunction.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        resources.m1.template.Resources.MyResource1.Properties.CodeUri[
          keywordFunction.keyword
        ] as FunctionType
      )
    ).resolves.toEqual({
      type: "object",
      value: {
        CodeUri: ".somod/serverless/functions/m1/func1",
        Environment: {
          Variables: {
            NODE_OPTIONS: "--enable-source-maps"
          }
        }
      },
      level: 1
    });
  });
});

describe("Test util getDeclaredFunctions in keyword function", () => {
  const moduleTemplates: Record<
    string,
    { module: string; template: ServerlessTemplate }
  > = {
    m1: {
      module: "m1",
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
            "SOMOD::Extend": { module: "m0", resource: "r0" },
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
  };

  test("for a complete template", async () => {
    mockedFunction(
      MergedFunctionResourceContainer.getFinalFunctionResource
    ).mockImplementation(async (c, m, r) => ({
      code: {
        function: {
          module: m,
          name: moduleTemplates[m].template.Resources[r].Properties.CodeUri[
            keywordFunction.keyword
          ].name
        },
        middlewares: []
      },
      resource: moduleTemplates[m].template.Resources[r]
    }));

    await expect(
      getDeclaredFunctions(
        {
          serverlessTemplateHandler: {
            getTemplate: m => moduleTemplates[m],
            getResource: (m, r) => ({
              resource: moduleTemplates[m].template.Resources[r]
            })
          } as IServerlessTemplateHandler
        } as IContext,
        "m1"
      )
    ).resolves.toEqual([
      { name: "func1", module: "m1", middlewares: [], exclude: ["aws-sdk"] },
      {
        name: "func3",
        module: "m1",
        middlewares: [],
        exclude: ["aws-sdk", "l1", "l2", "l3"]
      },
      {
        name: "func4",
        module: "m1",
        middlewares: [],
        exclude: ["aws-sdk", "l3", "l4"]
      },
      {
        name: "func5",
        module: "m1",
        middlewares: [],
        exclude: ["aws-sdk", "l1", "l2", "l3", "l4"]
      }
    ]);
  });
});

describe("Test util checkCustomResourceSchema in keyword function", () => {
  const moduleTemplates: Record<string, ServerlessTemplate> = {
    m1: {
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
        },
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
    }
  };

  const module1Node = parseJson(moduleTemplates.m1 as JSONType);

  test("for a reference other than Service Token", async () => {
    await expect(
      checkCustomResourceSchema(
        moduleTemplates.m1.Resources["CFNLambda"],
        (
          (
            (
              (module1Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["Resource1"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["MyProp"] as JSONObjectNode
      )
    ).resolves.toBeUndefined();
  });

  test("for missing schema", async () => {
    await expect(
      checkCustomResourceSchema(
        moduleTemplates.m1.Resources["CFNLambda"],
        (
          (
            (
              (module1Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R1Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode
      )
    ).rejects.toEqual(
      new Error(
        "Unable to find the schema for the custom resource R2. The custom resource function CFNLambda must define the schema for the custom resource."
      )
    );
  });

  test("for schema validation failure", async () => {
    await expect(
      checkCustomResourceSchema(
        moduleTemplates.m1.Resources["CFNLambda"],
        (
          (
            (
              (module1Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R2Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode
      )
    ).rejects.toEqual(
      new Error(
        `Custom Resource R2Resource has following validation errors\nmust have required property 'P1'`
      )
    );
  });

  test("for right schema", async () => {
    await expect(
      checkCustomResourceSchema(
        moduleTemplates.m1.Resources["CFNLambda"],
        (
          (
            (
              (module1Node as JSONObjectNode).properties[
                "Resources"
              ] as JSONObjectNode
            ).properties["R3Resource"] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ServiceToken"] as JSONObjectNode
      )
    ).resolves.toBeUndefined();
  });
});
