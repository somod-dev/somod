import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "@sodev/test-utils";
import { buildConfig } from "../../../src/utils/nextJs/config";
import { buildUiConfigYaml } from "../../../src";

jest.mock("../../../src/utils/nextJs/config", () => {
  return {
    __esModule: true,
    buildConfig: jest.fn()
  };
});

describe("test Task buildUiConfigYaml", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    mockedFunction(buildConfig).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no config.yaml", async () => {
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(buildConfig).toHaveBeenCalledTimes(0);
  });

  test("for valid config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": "" });
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(buildConfig).toHaveBeenCalledTimes(1);
    expect(buildConfig).toHaveBeenCalledWith(dir);
  });
});
