import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { yamlSchemaValidator } from "../../../src/utils/yamlSchemaValidator";
import { validateParametersWithSchema } from "../../../src";
import { join } from "path";
import { IContext } from "somod-types";

jest.mock("../../../src/utils/yamlSchemaValidator", () => {
  return {
    __esModule: true,
    yamlSchemaValidator: jest.fn()
  };
});

describe("test Task validateParametersWithSchema", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    mockedFunction(yamlSchemaValidator).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(
      validateParametersWithSchema({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(yamlSchemaValidator).toHaveBeenCalledTimes(0);
  });

  test("for valid parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": "" });
    await expect(
      validateParametersWithSchema({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(yamlSchemaValidator).toHaveBeenCalledTimes(1);
    expect(yamlSchemaValidator).toHaveBeenCalledWith(
      expect.any(Function),
      join(dir, "parameters.yaml")
    );
  });
});
