import { copyDirectory } from "@sodev/test-utils";
import { join } from "path";
import { validateUiConfigYaml } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const installSchemaInTempDir = async (dir: string) => {
  await copyDirectory(
    join(__dirname, "../../../../ui-config-schema"),
    join(dir, "node_modules/@somod/ui-config-schema")
  );
};

describe("Test Task validateUiConfigYaml", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no ui directory", async () => {
    await expect(validateUiConfigYaml(dir)).resolves.toBeUndefined();
  });

  test("For no config.yaml", async () => {
    createFiles(dir, {
      "ui/": ""
    });
    await expect(validateUiConfigYaml(dir)).resolves.toBeUndefined();
  });

  test("For empty config.yaml", async () => {
    await installSchemaInTempDir(dir);
    createFiles(dir, {
      "ui/config.yaml": ""
    });
    await expect(validateUiConfigYaml(dir)).rejects.toEqual(
      new Error(
        join(dir, "ui/config.yaml") + " has following errors\n must be object"
      )
    );
  });

  test("For config.yaml with only env", async () => {
    await installSchemaInTempDir(dir);
    createFiles(dir, {
      "ui/config.yaml": `
env:
  MY_ENV_VAR:
    SOMOD::Parameter: myparameter
`
    });
    await expect(validateUiConfigYaml(dir)).resolves.toBeUndefined();
  });
});
