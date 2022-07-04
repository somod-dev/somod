import { createTempDir, deleteDir, mockedFunction } from "@sodev/test-utils";
import { generate } from "../../../src/utils/parameters/generate";
import { generateRootParameters } from "../../../src";

jest.mock("../../../src/utils/parameters/generate", () => {
  return {
    __esModule: true,
    generate: jest.fn()
  };
});

describe("test Task generateRootParameters", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    mockedFunction(generate).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no override", async () => {
    await expect(
      generateRootParameters(dir, ["somod"])
    ).resolves.toBeUndefined();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(dir, ["somod"], false);
  });

  test("for override", async () => {
    await expect(
      generateRootParameters(dir, ["somod"], true)
    ).resolves.toBeUndefined();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith(dir, ["somod"], true);
  });
});
