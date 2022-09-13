import { join } from "path";
import { validateUiConfigYamlWithSchema } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task validateUiConfigYamlWithSchema", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no ui directory", async () => {
    await expect(validateUiConfigYamlWithSchema(dir)).resolves.toBeUndefined();
  });

  test("For no config.yaml", async () => {
    createFiles(dir, {
      "ui/": ""
    });
    await expect(validateUiConfigYamlWithSchema(dir)).resolves.toBeUndefined();
  });

  test("For empty config.yaml", async () => {
    createFiles(dir, {
      "ui/config.yaml": ""
    });
    await expect(validateUiConfigYamlWithSchema(dir)).rejects.toEqual(
      new Error(
        join(dir, "ui/config.yaml") + " has following errors\n must be object"
      )
    );
  }, 20000);

  test("For config.yaml with only env", async () => {
    createFiles(dir, {
      "ui/config.yaml": `
env:
  MY_ENV_VAR:
    SOMOD::Parameter: myparameter
`
    });
    await expect(validateUiConfigYamlWithSchema(dir)).resolves.toBeUndefined();
  }, 20000);
});
