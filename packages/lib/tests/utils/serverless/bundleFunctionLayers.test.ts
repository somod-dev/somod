import { createFiles, createTempDir, deleteDir } from "../../utils";
import { existsSync } from "fs";
import { join } from "path";
import { bundleFunctionLayers } from "../../../src/utils/serverless/bundleFunctionLayers";
import { keywordFunctionLayer } from "../../../src/utils/serverless/keywords/functionLayer";

describe("Test Task bundleFunctionLayers", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw"
      })
    });

    await expect(
      bundleFunctionLayers(dir, {
        module: "m0",
        packageLocation: "",
        template: { Resources: {} }
      })
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with empty layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw"
      })
    });

    await expect(
      bundleFunctionLayers(dir, {
        module: "m0",
        packageLocation: "",
        template: {
          Resources: {
            L1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: { name: "layer1" }
                }
              }
            }
          }
        }
      })
    ).resolves.toBeUndefined();
  });

  test("with missing library in dev Dependencies", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw"
      })
    });
    await expect(
      bundleFunctionLayers(dir, {
        module: "m0",
        packageLocation: "",
        template: {
          Resources: {
            L1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer1",
                    libraries: ["lodash"]
                  }
                }
              }
            }
          }
        }
      })
    ).rejects.toEqual(
      new Error(
        "Following layer libraries are missing as dev dependencies\nlodash - (layer1)"
      )
    );

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/layer1/nodejs/node_modules/lodash"
        )
      )
    ).not.toBeTruthy();
  }, 20000);

  test("with invalid library in layer", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw",
        devDependencies: {
          "@sodaru/dssfkdasfkjdhskfhakjdhkfkadhkf": "^1.0.0"
        }
      })
    });
    await expect(
      bundleFunctionLayers(dir, {
        module: "m0",
        packageLocation: "",
        template: {
          Resources: {
            L1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer1",
                    libraries: ["@sodaru/dssfkdasfkjdhskfhakjdhkfkadhkf"]
                  }
                }
              }
            }
          }
        }
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "bundle function layer failed for layer1"
      )
    });

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/layer1/nodejs/node_modules/lodash"
        )
      )
    ).not.toBeTruthy();
  }, 20000);

  test("with multiple layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw",
        devDependencies: {
          lodash: "^4.17.21",
          smallest: "^1.0.1"
        }
      })
    });
    await expect(
      bundleFunctionLayers(dir, {
        module: "m0",
        packageLocation: "",
        template: {
          Resources: {
            L1: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer1",
                    libraries: ["lodash", "smallest"]
                  }
                }
              }
            },
            L2: {
              Type: "AWS::Serverless::LayerVersion",
              Properties: {
                ContentUri: {
                  [keywordFunctionLayer.keyword]: {
                    name: "layer2",
                    libraries: ["smallest"]
                  }
                }
              }
            }
          }
        }
      })
    ).resolves.toBeUndefined();

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/layer1/nodejs/node_modules/lodash"
        )
      )
    ).toBeTruthy();
    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/layer1/nodejs/node_modules/smallest"
        )
      )
    ).toBeTruthy();

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/layer2/nodejs/node_modules/smallest"
        )
      )
    ).toBeTruthy();
  }, 20000);
});
