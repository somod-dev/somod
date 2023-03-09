import { IContext } from "somod-types";
import { buildServerlessTemplate } from "../../../src";
import { build } from "../../../src/utils/serverless/serverlessTemplate/build";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("../../../src/utils/serverless/serverlessTemplate/build", () => {
  return {
    __exModule: true,
    build: jest.fn()
  };
});

describe("Test Task buildServerlessTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(build).mockReset();
  });

  test("For no serverless directory", async () => {
    await expect(
      buildServerlessTemplate({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(0);
  });

  test("For no template", async () => {
    createFiles(dir, {
      "serverless/": ""
    });
    await expect(
      buildServerlessTemplate({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(0);
  });

  test("For a template", async () => {
    createFiles(dir, {
      "serverless/template.yaml": ""
    });
    await expect(
      buildServerlessTemplate({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(dir);
  });
});
