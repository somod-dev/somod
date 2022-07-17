import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "@sodev/test-utils";
import { build } from "../../../src/utils/parameters/build";
import { buildParameters } from "../../../src";

jest.mock("../../../src/utils/parameters/build", () => {
  return {
    __esModule: true,
    build: jest.fn()
  };
});

describe("test Task buildParameters", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    mockedFunction(build).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(buildParameters(dir)).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(0);
  });

  test("for valid parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": "" });
    await expect(buildParameters(dir)).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(dir);
  });
});
