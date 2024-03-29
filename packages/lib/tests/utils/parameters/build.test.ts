import { createFiles, createTempDir, deleteDir } from "../../utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { build } from "../../../src/utils/parameters/build";
import { IContext } from "somod-types";

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
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(build({ dir } as IContext)).rejects.toMatchObject({
      message: `ENOENT: no such file or directory, open '${join(
        dir,
        "parameters.yaml"
      )}'`
    });
  });

  test("for empty parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": "" });
    await build({ dir } as IContext);
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}");
  });

  test("for empty object in parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": dump({}) });
    await expect(build({ dir } as IContext)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}");
  });

  test("for no parameters in parameters.yaml", async () => {
    createFiles(dir, { "parameters.yaml": dump({ parameters: {} }) });
    await expect(build({ dir } as IContext)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual('{"parameters":{}}');
  });

  test("for one parameter in parameters.yaml", async () => {
    const parameters = {
      parameters: { "my.param": { type: "string", default: "one" } }
    };
    createFiles(dir, {
      "parameters.yaml": dump(parameters)
    });
    await expect(build({ dir } as IContext)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(JSON.stringify(parameters));
  });
});
