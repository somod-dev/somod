import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../../utils";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import {
  getFunctionLayerLibraries,
  keywordFunctionLayer
} from "../../../../src/utils/serverless/keywords/functionLayer";
import { join } from "path";
import { readdir, readFile } from "fs/promises";
import { JSONObjectNode } from "somod-types";

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
    const validator = await keywordFunctionLayer.getValidator(
      "",
      "m1",
      null,
      null
    );

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
    const validator = await keywordFunctionLayer.getValidator(
      "",
      "m1",
      null,
      null
    );

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
    const validator = await keywordFunctionLayer.getValidator(
      "",
      "m1",
      null,
      null
    );

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
    const validator = await keywordFunctionLayer.getValidator(
      "",
      "m1",
      null,
      null
    );

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
    await keywordFunctionLayer.getValidator("/root/dir", "m1", null, null);
    expect(readJsonFileStore).toHaveBeenCalledTimes(1);
    expect(readJsonFileStore).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "package.json")
    );
  });

  test("the processor", async () => {
    const processor = await keywordFunctionLayer.getProcessor(
      "/root/dir",
      "m1",
      null,
      null
    );

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

    const objNode = parseJson(obj) as JSONObjectNode;

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
        obj.Resources.MyResource1.Properties.ContentUri[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType
      )
    ).toEqual({
      type: "object",
      value: "/root/dir/.somod/serverless/functionLayers/m1/layer1"
    });
  });
});

describe("Test util processor of functionLayer keyword with overriding content", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("without content", async () => {
    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      null,
      null
    );

    const obj = {
      [keywordFunctionLayer.keyword]: {
        name: "layer1",
        libraries: ["l1", "l2"]
      }
    };

    const layerNode = parseJson(obj);

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        obj[keywordFunctionLayer.keyword]
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(
        join(dir, "/.somod/serverless/functionLayers/m1/layer1")
      )
    });

    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("with one new file in content", async () => {
    const obj = {
      [keywordFunctionLayer.keyword]: {
        name: "layer1",
        libraries: ["l1", "l2"],
        content: {
          "a/b.json": "[1, 2, 3]"
        }
      }
    };

    const layerNode = parseJson(obj);

    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      null,
      null
    );

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        obj[keywordFunctionLayer.keyword]
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(
        join(dir, ".somod/serverless/functionLayers/m1/layer1")
      )
    });

    await expect(
      readFile(
        join(dir, ".somod/serverless/functionLayers/m1/layer1/a/b.json"),
        "utf8"
      )
    ).resolves.toEqual("[1, 2, 3]");
  });

  test("with overriding file in content", async () => {
    createFiles(dir, {
      ".somod/serverless/functionLayers/m1/layer1/a.json":
        '"waw this gets replaced"'
    });

    const obj = {
      [keywordFunctionLayer.keyword]: {
        name: "layer1",
        libraries: ["l1", "l2"],
        content: {
          "a.json": "123",
          "a/b.json": "[1, 2, 3]"
        }
      }
    };

    const layerNode = parseJson(obj);

    const processor = await keywordFunctionLayer.getProcessor(
      dir,
      "m1",
      null,
      null
    );

    expect(
      processor(
        keywordFunctionLayer.keyword,
        layerNode as JSONObjectNode,
        obj[keywordFunctionLayer.keyword]
      )
    ).toEqual({
      type: "object",
      value: unixStylePath(
        join(dir, ".somod/serverless/functionLayers/m1/layer1")
      )
    });

    await expect(
      readFile(
        join(dir, ".somod/serverless/functionLayers/m1/layer1/a.json"),
        "utf8"
      )
    ).resolves.toEqual("123");
    await expect(
      readFile(
        join(dir, ".somod/serverless/functionLayers/m1/layer1/a/b.json"),
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
          },
          R5: {
            Type: "AWS::Serverless::LayerVersion",
            "SOMOD::Extend": { module: "m2", resource: "r1" },
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
      })
    ).toEqual({
      layer1: [],
      layer2: [],
      layer3: ["l1", "l2", "l3"],
      layer4: ["l3", "l4"]
    });
  });
});
