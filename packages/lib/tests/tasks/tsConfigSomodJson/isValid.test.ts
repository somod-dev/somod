import { IContext } from "somod-types";
import { isValidTsConfigSomodJson } from "../../../src";
import { validate } from "../../../src/utils/tsConfigSomodJson";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("../../../src/utils/tsConfigSomodJson", () => {
  return {
    __esModule: true,
    validate: jest.fn()
  };
});

describe("Test task isValidTsConfigSomodJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(validate).mockReset();
  });

  test("for no existing file", async () => {
    await expect(
      isValidTsConfigSomodJson({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(validate).toHaveBeenCalledTimes(0);
  });

  test("for existing file", async () => {
    createFiles(dir, { "tsconfig.somod.json": "" });
    await expect(
      isValidTsConfigSomodJson({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledWith({ dir });
  });
});
