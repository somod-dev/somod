import { createFiles, createTempDir, deleteDir } from "../../utils";
import { saveEslintIgnore } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { read, update } from "../../../src/utils/ignoreFileStore";
import { readFile } from "fs/promises";

describe("Test Task saveEslintIgnore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no eslintIgnore", async () => {
    await expect(saveEslintIgnore(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".eslintignore"))).toBeFalsy();
  });

  test("for eslintIgnore with out update", async () => {
    createFiles(dir, {
      ".eslintignore": "node_modules"
    });
    await expect(saveEslintIgnore(dir)).resolves.toBeUndefined();
  });

  test("for eslintIgnore with update", async () => {
    createFiles(dir, {
      ".eslintignore": "node_modules"
    });
    const eslintIgnorePath = join(dir, ".eslintignore");
    const eslintIgnoreContent = await read(eslintIgnorePath);
    eslintIgnoreContent.push("/build");
    update(eslintIgnorePath, eslintIgnoreContent);
    await expect(saveEslintIgnore(dir)).resolves.toBeUndefined();
    await expect(
      readFile(eslintIgnorePath, { encoding: "utf8" })
    ).resolves.toEqual(
      `node_modules
/build`
    );
  });
});
