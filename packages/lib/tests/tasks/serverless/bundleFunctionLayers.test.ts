import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { bundleFunctionLayers as bundleFunctionLayersUtil } from "../../../src/utils/serverless/bundleFunctionLayers";
import { bundleFunctionLayers } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { join } from "path";

jest.mock("../../../src/utils/serverless/bundleFunctionLayers", () => {
  return {
    __esModule: true,
    bundleFunctionLayers: jest.fn()
  };
});

describe("test Task bundleFunctionLayers", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, []);
    mockedFunction(bundleFunctionLayersUtil).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no template.yaml", async () => {
    await expect(bundleFunctionLayers(dir)).resolves.toBeUndefined();
    expect(bundleFunctionLayersUtil).toHaveBeenCalledTimes(0);
  });

  test("for valid template.yaml", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": "Resources: {}"
    });
    await expect(bundleFunctionLayers(dir)).resolves.toBeUndefined();
    expect(bundleFunctionLayersUtil).toHaveBeenCalledTimes(1);
    expect(bundleFunctionLayersUtil).toHaveBeenCalledWith(
      dir,
      {
        module: "my-module",
        packageLocation: join(dir),
        root: true,
        template: { Resources: {} }
      },
      false
    );
  });
});
