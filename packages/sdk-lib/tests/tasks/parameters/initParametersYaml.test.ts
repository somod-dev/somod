import { readFile } from "fs/promises";
import { join } from "path";
import { initParametersYaml } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initParametersYaml", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(initParametersYaml(dir)).resolves.toBeUndefined();
    await expect(readFile(join(dir, "parameters.yaml"), { encoding: "utf8" }))
      .resolves
      .toEqual(`# yaml-language-server: $schema=./node_modules/@somod/parameters-schema/schemas/index.json

Parameters: {}

`);
  });

  test("for prior parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": "" });
    await expect(initParametersYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.yaml"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });
});
