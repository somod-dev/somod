import { copyDirectory } from "@sodev/test-utils";
import { join } from "path";
import { validateUiConfigYamlWithSchema } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const installSchemaInTempDir = async (dir: string) => {
  await copyDirectory(
    join(__dirname, "../../../../schema"),
    join(dir, "node_modules/@somod/schema")
  );
};

describe("Test Task validateUiConfigYamlWithSchema", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
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
    await installSchemaInTempDir(dir);
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
    await installSchemaInTempDir(dir);
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
