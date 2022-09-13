import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "@sodev/test-utils";
import { bundleFunctions as bundleFunctionsUtil } from "../../../src/utils/serverless/bundleFunctions";
import { bundleFunctions } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { join } from "path";

jest.mock("../../../src/utils/serverless/bundleFunctions", () => {
  return {
    __esModule: true,
    bundleFunctions: jest.fn()
  };
});

describe("test Task bundleFunctions", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    ModuleHandler.initialize(dir, []);
    mockedFunction(bundleFunctionsUtil).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no template.yaml", async () => {
    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
    expect(bundleFunctionsUtil).toHaveBeenCalledTimes(0);
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
    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
    expect(bundleFunctionsUtil).toHaveBeenCalledTimes(1);
    expect(bundleFunctionsUtil).toHaveBeenCalledWith(
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
