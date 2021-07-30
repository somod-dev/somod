import { createFiles, createTempDir, deleteDir } from "../../utils";
import { savePrettierIgnore } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { read, update } from "../../../src/utils/ignoreFileStore";
import { readFile } from "fs/promises";

describe("Test Task savePrettierIgnore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prettierIgnore", async () => {
    await expect(savePrettierIgnore(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".prettierignore"))).toBeFalsy();
  });

  test("for prettierIgnore with out update", async () => {
    createFiles(dir, {
      ".prettierignore": "node_modules"
    });
    await expect(savePrettierIgnore(dir)).resolves.toBeUndefined();
  });

  test("for prettierIgnore with update", async () => {
    createFiles(dir, {
      ".prettierignore": "node_modules"
    });
    const prettierIgnorePath = join(dir, ".prettierignore");
    const prettierIgnoreContent = await read(prettierIgnorePath);
    prettierIgnoreContent.push("/build");
    update(prettierIgnorePath, prettierIgnoreContent);
    await expect(savePrettierIgnore(dir)).resolves.toBeUndefined();
    await expect(
      readFile(prettierIgnorePath, { encoding: "utf8" })
    ).resolves.toEqual(
      `node_modules
/build`
    );
  });
});
