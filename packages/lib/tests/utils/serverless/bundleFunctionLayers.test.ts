import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { IContext } from "somod-types";
import { bundleFunctionLayers } from "../../../src/utils/serverless/bundleFunctionLayers";
import { getDeclaredFunctionLayers } from "../../../src/utils/serverless/keywords/functionLayer";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("../../../src/utils/serverless/keywords/functionLayer", () => {
  const original = jest.requireActual(
    "../../../src/utils/serverless/keywords/functionLayer"
  );
  return {
    __esModule: true,
    ...original,
    getDeclaredFunctionLayers: jest.fn()
  };
});

describe("Test Task bundleFunctionLayers", () => {
  let dir: string;
  const originalStdErrWrite = process.stderr.write;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    process.stderr.write = jest.fn();
    mockedFunction(getDeclaredFunctionLayers).mockReset();
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
    mockedFunction(getDeclaredFunctionLayers).mockReturnValue([]);
    const modules = [
      {
        module: { name: "m0", version: "v1.0.0", packageLocation: dir },
        parents: [],
        children: []
      }
    ];

    await expect(
      bundleFunctionLayers({
        dir,
        moduleHandler: {
          list: modules,
          getModule: (() =>
            modules[0]) as IContext["moduleHandler"]["getModule"]
        },
        serverlessTemplateHandler: {
          listTemplates: () => [{ module: "m0", template: { Resources: {} } }]
        }
      } as IContext)
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with empty layers", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m0"
      })
    });
    mockedFunction(getDeclaredFunctionLayers).mockReturnValue([
      { name: "layer1", module: "m0", libraries: [], content: [] }
    ]);
    const modules = [
      {
        module: { name: "m0", version: "v1.0.0", packageLocation: dir },
        parents: [],
        children: []
      }
    ];

    await expect(
      bundleFunctionLayers({
        dir,
        moduleHandler: {
          list: modules,
          getModule: (() =>
            modules[0]) as IContext["moduleHandler"]["getModule"]
        },
        serverlessTemplateHandler: {
          listTemplates: () => [{ module: "m0", template: { Resources: {} } }]
        }
      } as IContext)
    ).resolves.toBeUndefined();
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

    mockedFunction(getDeclaredFunctionLayers).mockReturnValue([
      {
        name: "layer1",
        module: "m0",
        libraries: [
          { name: "@sodaru/dssfkdasfkjdhskfhakjdhkfkadhkf", module: "m0" }
        ],
        content: []
      }
    ]);
    const modules = [
      {
        module: { name: "m0", version: "v1.0.0", packageLocation: dir },
        parents: [],
        children: []
      }
    ];

    await expect(
      bundleFunctionLayers({
        dir,
        moduleHandler: {
          list: modules,
          getModule: (() =>
            modules[0]) as IContext["moduleHandler"]["getModule"]
        },
        serverlessTemplateHandler: {
          listTemplates: () => [{ module: "m0", template: { Resources: {} } }]
        }
      } as IContext)
    ).rejects.toMatchObject({
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

  test("with multiple layers and content", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "waw",
        devDependencies: {
          lodash: "^4.17.21",
          smallest: "^1.0.1"
        }
      }),
      ".somod/serverless/.functionLayers/m0/L0/my/content": "hello",
      ".somod/serverless/.functionLayers/m1/L1/my/another/content": "world"
    });

    mockedFunction(getDeclaredFunctionLayers).mockReturnValue([
      {
        name: "layer1",
        module: "m0",
        libraries: [
          { name: "lodash", module: "m0" },
          { name: "smallest", module: "m0" }
        ],
        content: [
          { path: "my/content", module: "m0", resource: "L0" },
          { path: "my/another/content", module: "m1", resource: "L1" }
        ]
      },
      {
        name: "layer2",
        module: "m0",
        libraries: [{ name: "smallest", module: "m0" }],
        content: []
      }
    ]);
    const modules = [
      {
        module: { name: "m0", version: "v1.0.0", packageLocation: dir },
        parents: [],
        children: []
      }
    ];

    await expect(
      bundleFunctionLayers({
        dir,
        moduleHandler: {
          list: modules,
          getModule: (() =>
            modules[0]) as IContext["moduleHandler"]["getModule"]
        },
        serverlessTemplateHandler: {
          listTemplates: () => [{ module: "m0", template: { Resources: {} } }]
        }
      } as IContext)
    ).resolves.toBeUndefined();

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
    await expect(
      readFile(
        join(dir, ".somod/serverless/functionLayers/m0/layer1/my/content"),
        "utf8"
      )
    ).resolves.toEqual("hello");
    await expect(
      readFile(
        join(
          dir,
          ".somod/serverless/functionLayers/m0/layer1/my/another/content"
        ),
        "utf8"
      )
    ).resolves.toEqual("world");

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
