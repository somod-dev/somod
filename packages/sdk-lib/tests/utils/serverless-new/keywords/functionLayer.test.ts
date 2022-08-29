import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "@sodev/test-utils";
import {
  JSONObjectNode,
  JSONType,
  parseJson
} from "../../../../src/utils/jsonTemplate";
import { readJsonFileStore, unixStylePath } from "@solib/cli-base";
import {
  getFunctionLayerLibraries,
  keywordFunctionLayer
} from "../../../../src/utils/serverless-new/keywords/functionLayer";
import { join } from "path";
import { ModuleContentMap } from "../../../../src/utils/keywords/types";
import { ServerlessTemplate } from "../../../../src/utils/serverless-new/types";
import { readdir, readFile } from "fs/promises";

jest.mock("@solib/cli-base", () => {
  const original = jest.requireActual("@solib/cli-base");
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
    const validator = await keywordFunctionLayer.getValidator("", "m1", {});

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
    const validator = await keywordFunctionLayer.getValidator("", "m1", {});

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
    const validator = await keywordFunctionLayer.getValidator("", "m1", {});

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
    const validator = await keywordFunctionLayer.getValidator("", "m1", {});

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
    await keywordFunctionLayer.getValidator("/root/dir", "m1", {});
    expect(readJsonFileStore).toHaveBeenCalledTimes(1);
    expect(readJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "package.json")
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
        }
      }
    };

    const processor = await keywordFunctionLayer.getProcessor(
      "",
      "m1",
      allModules
    );

    const objNode = parseJson(allModules.m1.json) as JSONObjectNode;

    expect(
      processor(
        keywordFunctionLayer.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["ContentUri"] as JSONObjectNode,
        allModules.m1.json.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual({
      type: "object",
      value: "/a/b/c/build/serverless/functionLayers/layer1"
    });
  });
});

describe("Test util processor of functionLayer keyword with overriding content", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getInputs = (dir: string, content?: Record<string, string>) => {
    const allModules = {
      m1: {
        moduleName: "m1",
        location: dir,
        path: "serverless/template.yaml",
        json: {
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
        }
      }
    };

    if (content) {
      allModules.m1.json.Resources.MyResource1.Properties.ContentUri[
        keywordFunctionLayer.keyword
      ]["content"] = content;
    }

    const objNode = parseJson(allModules.m1.json as JSONType) as JSONObjectNode;

    const layerNode = (
      (
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode
      ).properties["Properties"] as JSONObjectNode
    ).properties["ContentUri"] as JSONObjectNode;

    return [allModules, layerNode];
  };

  test("without content", async () => {
    const [allModules, layerNode] = getInputs(dir);

    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      allModules as ModuleContentMap<ServerlessTemplate>
    );

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        allModules["m1"].json.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(join(dir, "/build/serverless/functionLayers/layer1"))
    });

    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("with one new file in content", async () => {
    const [allModules, layerNode] = getInputs(dir, {
      "a/b.json": "[1, 2, 3]"
    });

    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      allModules as ModuleContentMap<ServerlessTemplate>
    );

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        allModules["m1"].json.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(join(dir, "/build/serverless/functionLayers/layer1"))
    });

    await expect(
      readFile(
        join(dir, "build/serverless/functionLayers/layer1/a/b.json"),
        "utf8"
      )
    ).resolves.toEqual("[1, 2, 3]");
  });

  test("with overriding file in content", async () => {
    createFiles(dir, {
      "build/serverless/functionLayers/layer1/a.json":
        '"waw this gets replaced"'
    });

    const [allModules, layerNode] = getInputs(dir, {
      "a.json": "123",
      "a/b.json": "[1, 2, 3]"
    });

    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      allModules as ModuleContentMap<ServerlessTemplate>
    );

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        allModules["m1"].json.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(join(dir, "/build/serverless/functionLayers/layer1"))
    });

    await expect(
      readFile(
        join(dir, "build/serverless/functionLayers/layer1/a.json"),
        "utf8"
      )
    ).resolves.toEqual("123");
    await expect(
      readFile(
        join(dir, "build/serverless/functionLayers/layer1/a/b.json"),
        "utf8"
      )
    ).resolves.toEqual("[1, 2, 3]");
  });
});

describe("Test util getFunctionLayerLibraries in keyword functionLayer", () => {
  test("for a complete template", () => {
    expect(
      getFunctionLayerLibraries({
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
          }
        }
      })
    ).toEqual({
      layer1: [],
      layer2: [],
      layer3: ["l1", "l2", "l3"],
      layer4: ["l3", "l4"]
    });
  });
});
