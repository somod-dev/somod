import { createFiles, createTempDir, deleteDir } from "../../utils";
import { ExtensionHandler } from "../../../src/utils/extension/handler";
import { IModuleHandler } from "somod-types";
import { join } from "path";

describe("Test util ExtensionHandler", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
    ExtensionHandler["instance"] = undefined;
  });

  test("with no modules", async () => {
    const extensionHandler = await ExtensionHandler.getInstance({
      list: []
    } as IModuleHandler);
    expect(extensionHandler.prebuildHooks).toEqual([]);
    expect(extensionHandler.buildHooks).toEqual([]);
    expect(extensionHandler.preprepareHooks).toEqual([]);
    expect(extensionHandler.prepareHooks).toEqual([]);
    expect(extensionHandler.namespaceLoaders).toEqual([]);
    expect(extensionHandler.serverlessTemplateKeywords).toEqual([]);
    expect(extensionHandler.uiConfigKeywords).toEqual([]);
    expect(extensionHandler.functionLayers).toEqual([]);
    expect(extensionHandler.functionMiddlewares).toEqual([]);
  });

  test("with valid extensions", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        somod: "1.0.0",
        version: "1.2.0",
        dependencies: {
          "somod-extension1": "^1.0.0"
        }
      }),
      "build/extension.js": `module.exports = {
        namespaceLoader: 10 
      }`, // extension from root module is skipped because the extension will not be bundlled during the start of build command
      "node_modules/somod-extension1/package.json": JSON.stringify({
        name: "somod-extension1",
        version: "1.2.0",
        somod: "1.0.0",
        dependencies: {
          "somod-extension2": "^1.0.0"
        }
      }),
      "node_modules/somod-extension1/build/extension.js": `module.exports = {
        prebuild: 10,
        namespaceLoader: 20,
        functionLayers: [30],
      }`,
      "node_modules/somod-extension2/package.json": JSON.stringify({
        name: "somod-extension2",
        version: "1.2.0",
        somod: "1.0.0"
      }),
      "node_modules/somod-extension2/build/extension.js": `module.exports = {
        prebuild: 500,
        build: 600,
        preprepare: 700,
        prepare: 800,
        namespaceLoader: 900,
        uiConfigKeywords: [1000, 2000],
        serverlessTemplateKeywords: [3000, 4000, 5000],
        functionLayers: [6000],
        functionMiddlewares: [7000, 8000],
        extra1: 9000,
        extra2: [10000, 20000]
      }`
    });

    const extensionHandler = await ExtensionHandler.getInstance({
      list: [
        {
          module: {
            name: "m1",
            packageLocation: dir,
            root: true,
            version: "v1.0.0"
          }
        },
        {
          module: {
            name: "somod-extension1",
            packageLocation: join(dir, "node_modules/somod-extension1"),
            version: "v1.0.0"
          }
        },
        {
          module: {
            name: "somod-extension2",
            packageLocation: join(dir, "node_modules/somod-extension2"),
            version: "v1.0.0"
          }
        },
        {
          module: {
            name: "m2",
            packageLocation: join(dir, "node_modules/m2"),
            version: "v1.0.0"
          }
        }
      ]
    } as IModuleHandler);

    expect(extensionHandler.prebuildHooks).toEqual([
      { extension: "somod-extension2", value: 500 },
      { extension: "somod-extension1", value: 10 }
    ]);
    expect(extensionHandler.buildHooks).toEqual([
      { extension: "somod-extension2", value: 600 }
    ]);
    expect(extensionHandler.preprepareHooks).toEqual([
      { extension: "somod-extension2", value: 700 }
    ]);
    expect(extensionHandler.prepareHooks).toEqual([
      { extension: "somod-extension2", value: 800 }
    ]);
    expect(extensionHandler.namespaceLoaders).toEqual([
      { extension: "somod-extension2", value: 900 },
      { extension: "somod-extension1", value: 20 }
    ]);
    expect(extensionHandler.serverlessTemplateKeywords).toEqual([
      { extension: "somod-extension2", value: [3000, 4000, 5000] }
    ]);
    expect(extensionHandler.uiConfigKeywords).toEqual([
      { extension: "somod-extension2", value: [1000, 2000] }
    ]);
    expect(extensionHandler.functionLayers).toEqual([
      { extension: "somod-extension2", value: [6000] },
      { extension: "somod-extension1", value: [30] }
    ]);
    expect(extensionHandler.functionMiddlewares).toEqual([
      { extension: "somod-extension2", value: [7000, 8000] }
    ]);
    expect(extensionHandler.get("extra1")).toEqual([
      { extension: "somod-extension2", value: 9000 }
    ]);
    expect(extensionHandler.get("extra2")).toEqual([
      { extension: "somod-extension2", value: [10000, 20000] }
    ]);
    expect(extensionHandler.get("extra3")).toEqual([]);
  });
});
