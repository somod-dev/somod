import { createTempDir, deleteDir, mockedFunction } from "../../utils";
import { yamlSchemaValidator } from "../../../src/utils/yamlSchemaValidator";
import { validateParametersWithSchema } from "../../../src";
import { join } from "path";

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

  test("test", async () => {
    await expect(validateParametersWithSchema(dir)).resolves.toBeUndefined();
    expect(yamlSchemaValidator).toHaveBeenCalledTimes(1);
    expect(yamlSchemaValidator).toHaveBeenCalledWith(
      expect.any(Function),
      join(dir, "parameters.yaml")
    );
  });
});
