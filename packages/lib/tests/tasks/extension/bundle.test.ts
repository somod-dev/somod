import { IContext } from "somod-types";
import { bundleExtension } from "../../../src";
import { bundle } from "../../../src/utils/extension/bundle";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("../../../src/utils/extension/bundle", () => {
  return {
    __esModule: true,
    bundle: jest.fn()
  };
});

describe("Test Task bundleExtension", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(bundle).mockReset();
  });

  test("for no extension file", async () => {
    mockedFunction(bundle).mockResolvedValue();

    await expect(
      bundleExtension({ dir: "sample" } as IContext, true)
    ).resolves.toBeUndefined();
    expect(bundle).toHaveBeenCalledTimes(0);
  });

  test("for successfull initialization", async () => {
    createFiles(dir, { "extension.ts": "" });
    mockedFunction(bundle).mockResolvedValue();

    await expect(
      bundleExtension({ dir } as IContext, true)
    ).resolves.toBeUndefined();
    expect(bundle).toHaveBeenCalledTimes(1);
    expect(bundle).toHaveBeenCalledWith({ dir } as IContext, true);
  });

  test("for failed initialization", async () => {
    createFiles(dir, { "extension.ts": "" });
    mockedFunction(bundle).mockRejectedValue(
      new Error("There is an error in bundling extension")
    );

    await expect(bundleExtension({ dir } as IContext)).rejects.toEqual(
      new Error("There is an error in bundling extension")
    );
    expect(bundle).toHaveBeenCalledTimes(1);
    expect(bundle).toHaveBeenCalledWith({ dir } as IContext, false);
  });
});
