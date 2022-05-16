import { createFiles, createTempDir, deleteDir } from "../../utils";
import { saveVercelIgnore } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { readIgnoreFileStore, updateIgnoreFileStore } from "@solib/cli-base";
import { readFile } from "fs/promises";

describe("Test Task saveVercelIgnore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no vercelIgnore", async () => {
    await expect(saveVercelIgnore(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".vercelignore"))).toBeFalsy();
  });

  test("for vercelIgnore with out update", async () => {
    createFiles(dir, {
      ".vercelignore": "node_modules"
    });
    await expect(saveVercelIgnore(dir)).resolves.toBeUndefined();
  });

  test("for vercelIgnore with update", async () => {
    createFiles(dir, {
      ".vercelignore": "node_modules"
    });
    const vercelIgnorePath = join(dir, ".vercelignore");
    const vercelIgnoreContent = await readIgnoreFileStore(vercelIgnorePath);
    vercelIgnoreContent.push("/build");
    updateIgnoreFileStore(vercelIgnorePath, vercelIgnoreContent);
    await expect(saveVercelIgnore(dir)).resolves.toBeUndefined();
    await expect(
      readFile(vercelIgnorePath, { encoding: "utf8" })
    ).resolves.toEqual(`node_modules\n/build\n`);
  });
});
