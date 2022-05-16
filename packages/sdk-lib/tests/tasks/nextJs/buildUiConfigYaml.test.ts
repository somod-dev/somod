import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { buildUiConfigYaml } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task buildUiConfigYaml", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no ui directory", async () => {
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build/ui/config.json"))).not.toBeTruthy();
  });

  test("For no config.yaml", async () => {
    createFiles(dir, {
      "ui/": ""
    });
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build/ui/config.json"))).not.toBeTruthy();
  });

  test("For empty config.yaml", async () => {
    createFiles(dir, {
      "ui/config.yaml": ""
    });
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "build/ui/config.json"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual(JSON.stringify({}, null, 2));
  });

  test("For config.yaml with only env", async () => {
    createFiles(dir, {
      "ui/config.yaml": `
env:
  MY_ENV_VAR:
    default: abcd
    schema:
      type: string
`
    });
    await expect(buildUiConfigYaml(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "build/ui/config.json"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual(
      JSON.stringify(
        {
          env: { MY_ENV_VAR: { default: "abcd", schema: { type: "string" } } }
        },
        null,
        2
      )
    );
  });
});
