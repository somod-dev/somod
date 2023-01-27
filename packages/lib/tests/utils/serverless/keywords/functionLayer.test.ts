import { readFile } from "fs/promises";
import { createTempDir, deleteDir, readJsonFileStore } from "nodejs-file-utils";
import { join } from "path";
import { IContext, JSONObjectNode } from "somod-types";
import { resourceType_FunctionLayer } from "../../../../src";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import {
  getDeclaredFunctionLayers,
  keywordFunctionLayer
} from "../../../../src/utils/serverless/keywords/functionLayer";
import { mockedFunction } from "../../../utils";
import { getContext } from "./function-helper.test";

jest.mock("nodejs-file-utils", () => {
  const original = jest.requireActual("nodejs-file-utils");
  return {
    __esModule: true,
    ...original,
    readJsonFileStore: jest.fn()
  };
});

type FunctionLayerType = {
  name: string;
  libraries?: string[];
  content?: Record<string, string>;
};

describe("Test functionLayer keyword", () => {
  beforeEach(() => {
    mockedFunction(readJsonFileStore).mockReset();
    mockedFunction(readJsonFileStore).mockResolvedValue({
      devDependencies: {
        l1: "^1.2.3",
        l2: "^2.3.4",
        l3: "~4.5.6"
      }
    });
  });

  test("the keyword name", () => {
    expect(keywordFunctionLayer.keyword).toEqual("SOMOD::FunctionLayer");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordFunctionLayer.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      [keywordFunctionLayer.keyword]: {}
    };

    expect(
      validator(
        keywordFunctionLayer.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordFunctionLayer.keyword] as FunctionLayerType
      )
    ).toEqual([
      new Error(
        "SOMOD::FunctionLayer is allowed only as value of ContentUri property of AWS::Serverless::LayerVersion resource"
      )
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordFunctionLayer.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            [keywordFunctionLayer.keyword]: {}
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionLayer.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual([
      new Error(
        "SOMOD::FunctionLayer is allowed only as value of ContentUri property of AWS::Serverless::LayerVersion resource"
      )
    ]);
  });

  test("the validator with at ContentUri Property", async () => {
    const validator = await keywordFunctionLayer.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              [keywordFunctionLayer.keyword]: { name: "layer1" }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionLayer.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ContentUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual([]);
  });

  test("the validator with non existing libraries", async () => {
    const validator = await keywordFunctionLayer.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              [keywordFunctionLayer.keyword]: {
                name: "layer1",
                libraries: ["l0", "l1", "l2", "l4", "l5"]
              }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionLayer.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ContentUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual([
      new Error(
        "l0 required in layer layer1 does not exist in package.json as dev dependency"
      ),
      new Error(
        "l4 required in layer layer1 does not exist in package.json as dev dependency"
      ),
      new Error(
        "l5 required in layer layer1 does not exist in package.json as dev dependency"
      )
    ]);
  });

  test("the getValidator is calling readJsonFileStore", async () => {
    await keywordFunctionLayer.getValidator("m1", {
      dir: "/root/dir"
    } as IContext);
    expect(readJsonFileStore).toHaveBeenCalledTimes(1);
    expect(readJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "package.json")
    );
  });

  test("the processor", async () => {
    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              [keywordFunctionLayer.keyword]: {
                name: "layer1",
                libraries: ["l1", "l2"]
              }
            }
          }
        }
      }
    };

    const processor = await keywordFunctionLayer.getProcessor("m1", {
      dir: "/root/dir",
      serverlessTemplateHandler: {
        getResource: (() => ({
          resource: obj.Resources.MyResource1,
          propertySourceMap: {}
        })) as unknown as IContext["serverlessTemplateHandler"]["getResource"],
        getResourcePropertySource: (() => ({
          module: "m1",
          resource: "MyResource1",
          depth: 2
        })) as IContext["serverlessTemplateHandler"]["getResourcePropertySource"]
      }
    } as IContext);

    const objNode = parseJson(obj) as JSONObjectNode;

    await expect(
      processor(
        keywordFunctionLayer.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ContentUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).resolves.toEqual({
      type: "object",
      value: "/root/dir/.somod/serverless/functionLayers/m1/layer1"
    });
  });

  test("the processor with extended layer name and contents in the value", async () => {
    const dir = createTempDir("test-somod-lib");

    const obj = {
      Resources: {
        MyResource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            ContentUri: {
              [keywordFunctionLayer.keyword]: {
                name: "layer1",
                libraries: ["l1", "l2"],
                content: {
                  "my/path": "hello",
                  "/my/another/path": "world"
                }
              }
            }
          }
        }
      }
    };

    const processor = await keywordFunctionLayer.getProcessor("m1", {
      dir,
      serverlessTemplateHandler: {
        getResource: (() => ({
          resource: obj.Resources.MyResource1,
          propertySourceMap: {}
        })) as unknown as IContext["serverlessTemplateHandler"]["getResource"],
        getResourcePropertySource: (() => ({
          // getResourcePropertySource is called for getting the source of name, this refelcts in the generated path
          module: "m2",
          resource: "R1",
          depth: 2
        })) as IContext["serverlessTemplateHandler"]["getResourcePropertySource"]
      }
    } as IContext);

    const objNode = parseJson(obj) as JSONObjectNode;

    await expect(
      processor(
        keywordFunctionLayer.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ContentUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).resolves.toEqual({
      type: "object",
      value: join(dir, "/.somod/serverless/functionLayers/m2/layer1")
        .split("\\")
        .join("/")
    });

    await expect(
      readFile(
        join(dir, ".somod/serverless/.functionLayers/m1/MyResource1/my/path"),
        "utf8"
      )
    ).resolves.toEqual("hello");
    await expect(
      readFile(
        join(
          dir,
          ".somod/serverless/.functionLayers/m1/MyResource1/my/another/path"
        ),
        "utf8"
      )
    ).resolves.toEqual("world");
    deleteDir(dir);
  });
});

describe("Test util getDeclaredFunctionLayers in keyword functionLayer", () => {
  test("for a complete template", () => {
    const context = getContext([
      {
        name: "m0",
        template: {
          Resources: {
            r1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer5"
                  } as FunctionLayerType
                }
              }
            }
          }
        }
      },
      {
        name: "m1",
        dependencies: ["m0"],
        template: {
          Resources: {
            R1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer1"
                  } as FunctionLayerType
                }
              }
            },
            R2: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer2",
                    libraries: []
                  } as FunctionLayerType
                }
              }
            },
            R3: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer3",
                    libraries: ["l1", "l2", "l3"]
                  } as FunctionLayerType
                }
              }
            },
            R4: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer4",
                    libraries: ["l3", "l4"]
                  } as FunctionLayerType
                }
              }
            },
            R5: {
              Type: "AWS::Serverless::LayerVersion",
              "SOMOD::Extend": { module: "m0", resource: "r1" },
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer5",
                    libraries: ["l3", "l4"]
                  } as FunctionLayerType
                }
              }
            },
            R6: {
              Type: "SomeOtherType",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer5",
                    libraries: ["l3", "l4"]
                  } as FunctionLayerType
                }
              }
            }
          }
        }
      },
      {
        name: "m2",
        dependencies: ["m1"],
        template: {
          Resources: {
            L1: {
              Type: resourceType_FunctionLayer,
              "SOMOD::Extend": { module: "m1", resource: "R3" },
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "m2layer3",
                    content: {
                      "/my/config/file": "config"
                    }
                  } as FunctionLayerType
                }
              }
            },
            L2: {
              Type: resourceType_FunctionLayer,
              "SOMOD::Extend": {
                module: "m1",
                resource: "R4",
                rules: {
                  [`$.ContentUri["${keywordFunctionLayer.keyword}"].libraries`]:
                    "APPEND"
                }
              },
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    libraries: ["l4", "l5"]
                  } as FunctionLayerType
                }
              }
            }
          }
        }
      }
    ]);
    expect(
      getDeclaredFunctionLayers(context.serverlessTemplateHandler, "m1")
    ).toEqual([
      { content: [], libraries: [], module: "m1", name: "layer1" },
      { content: [], libraries: [], module: "m1", name: "layer2" },
      {
        content: [{ module: "m2", resource: "L1", path: "/my/config/file" }],
        libraries: [
          { module: "m1", name: "l1" },
          { module: "m1", name: "l2" },
          { module: "m1", name: "l3" }
        ],
        module: "m2",
        name: "m2layer3"
      },
      {
        content: [],
        libraries: [
          { module: "m1", name: "l3" },
          { module: "m1", name: "l4" },
          { module: "m2", name: "l4" },
          { module: "m2", name: "l5" }
        ],
        module: "m1",
        name: "layer4"
      }
    ]);
  });
});
