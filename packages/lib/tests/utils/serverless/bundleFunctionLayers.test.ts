import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { existsSync } from "fs";
import { join } from "path";
import { bundleFunctionLayers } from "../../../src/utils/serverless/bundleFunctionLayers";
import { keywordFunctionLayer } from "../../../src/utils/serverless/keywords/functionLayer";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { ServerlessTemplateHandler } from "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";
import { IServerlessTemplateHandler } from "somod-types";

jest.mock("../../../src/utils/moduleHandler", () => ({
  __esModule: true,
  ModuleHandler: {
    getModuleHandler: jest.fn()
  }
}));

jest.mock(
  "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => ({
    __esModule: true,
    ServerlessTemplateHandler: {
      getServerlessTemplateHandler: jest.fn()
    }
  })
);

describe("Test Task bundleFunctionLayers", () => {
  let dir: string;
  const originalStdErrWrite = process.stderr.write;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    process.stderr.write = jest.fn();
  });

  afterEach(() => {
    process.stderr.write = originalStdErrWrite;
    deleteDir(dir);
  });

  test("with no layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m0"
      })
    });
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [{ module: "m0", template: { Resources: {} } }]
    } as unknown as IServerlessTemplateHandler);

    await expect(bundleFunctionLayers(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with empty layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m0"
      })
    });
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [
        {
          module: "m0",
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
        }
      ]
    } as unknown as IServerlessTemplateHandler);

    await expect(bundleFunctionLayers(dir)).resolves.toBeUndefined();
  });

  test("with invalid library in layer", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw",
        devDependencies: {
          "@sodaru/dssfkdasfkjdhskfhakjdhkfkadhkf": "^1.0.0"
        }
      })
    });

    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [
        {
          module: "m0",
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
        }
      ]
    } as unknown as IServerlessTemplateHandler);

    await expect(bundleFunctionLayers(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "bundle function layer failed for layer1"
      )
    });

    expect(
      existsSync(
        join(
          dir,
          ".somod/serverless/functionLayers/m0/layer1/nodejs/node_modules/lodash"
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

    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [
        {
          module: "m0",
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
        }
      ]
    } as unknown as IServerlessTemplateHandler);

    await expect(bundleFunctionLayers(dir)).resolves.toBeUndefined();

    expect(
      existsSync(
        join(
          dir,
          ".somod/serverless/functionLayers/m0/layer1/nodejs/node_modules/lodash"
        )
      )
    ).toBeTruthy();
    expect(
      existsSync(
        join(
          dir,
          ".somod/serverless/functionLayers/m0/layer1/nodejs/node_modules/smallest"
        )
      )
    ).toBeTruthy();

    expect(
      existsSync(
        join(
          dir,
          ".somod/serverless/functionLayers/m0/layer2/nodejs/node_modules/smallest"
        )
      )
    ).toBeTruthy();
  }, 20000);
});
