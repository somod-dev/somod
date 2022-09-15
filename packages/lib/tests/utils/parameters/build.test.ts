import { createFiles, createTempDir, deleteDir } from "../../utils";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { build } from "../../../src/utils/parameters/build";
import { loadParameterNamespaces } from "../../../src/utils/parameters/namespace";

describe("Test Util parameters.build", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    ModuleHandler.initialize(dir, [loadParameterNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(build(dir)).rejects.toMatchObject({
      message: `ENOENT: no such file or directory, open '${join(
        dir,
        "parameters.yaml"
      )}'`
    });
  });

  test("for empty parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": "" });
    await expect(build(dir)).rejects.toMatchObject({
      message: `Cannot read properties of undefined (reading 'Parameters')`
    });
  });

  test("for empty object in parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": dump({}) });
    await expect(build(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}");
  });

  test("for no parameters in parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": dump({ Parameters: {} }) });
    await expect(build(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual('{"Parameters":{}}');
  });

  test("for one parameter in parameters.yaml", async () => {
    const parameters = {
      Parameters: { "my.param": { type: "text", default: "one" } }
    };
    createFiles(dir, {
      "parameters.yaml": dump(parameters)
    });
    await expect(build(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(JSON.stringify(parameters));
  });

  test("for long parameter in parameters.yaml", async () => {
    const parameters = {
      Parameters: {
        "my.param": { type: "text", default: "one" },
        ["my." + "x".repeat(128)]: { type: "text", default: "too-long-one" }
      }
    };
    createFiles(dir, {
      "parameters.yaml": dump(parameters)
    });
    await expect(build(dir)).rejects.toEqual(
      new Error(
        `Following parameters have too long name (maximum 128 characters are allowed)\n - my.${"x".repeat(
          128
        )}`
      )
    );
    expect(existsSync(join(dir, "build/parameters.json"))).not.toBeTruthy();
  });
});
