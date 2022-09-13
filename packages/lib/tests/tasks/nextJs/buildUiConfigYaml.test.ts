import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { build } from "../../../src/utils/nextJs/config";
import { buildUiConfigYaml } from "../../../src";

jest.mock("../../../src/utils/nextJs/config", () => {
  return {
    __esModule: true,
    build: jest.fn()
  };
});

describe("test Task buildUiConfigYaml", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    mockedFunction(build).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no config.yaml", async () => {
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(0);
  });

  test("for valid config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": "" });
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(dir);
  });
});
