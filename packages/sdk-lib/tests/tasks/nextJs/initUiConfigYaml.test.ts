import { readFile } from "fs/promises";
import { join } from "path";
import { initUiConfigYaml } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initUiConfigYaml", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no config.yaml", async () => {
    await expect(initUiConfigYaml(dir)).resolves.toBeUndefined();
    await expect(readFile(join(dir, "ui/config.yaml"), { encoding: "utf8" }))
      .resolves
      .toEqual(`# yaml-language-server: $schema=../node_modules/@somod/ui-config-schema/schemas/index.json

env: {}
imageDomains: []
publicRuntimeConfig: {}
serverRuntimeConfig: {}

`);
  });

  test("for prior config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": "" });
    await expect(initUiConfigYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "ui/config.yaml"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });
});
