import { createFiles, createTempDir, deleteDir } from "../../utils";
import { saveGitIgnore } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { readIgnoreFileStore, updateIgnoreFileStore } from "@solib/cli-base";
import { readFile } from "fs/promises";

describe("Test Task saveGitIgnore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no gitIgnore", async () => {
    await expect(saveGitIgnore(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".gitignore"))).toBeFalsy();
  });

  test("for gitIgnore with out update", async () => {
    createFiles(dir, {
      ".gitignore": "node_modules"
    });
    await expect(saveGitIgnore(dir)).resolves.toBeUndefined();
  });

  test("for gitIgnore with update", async () => {
    createFiles(dir, {
      ".gitignore": "node_modules"
    });
    const gitIgnorePath = join(dir, ".gitignore");
    const gitIgnoreContent = await readIgnoreFileStore(gitIgnorePath);
    gitIgnoreContent.push("/build");
    updateIgnoreFileStore(gitIgnorePath, gitIgnoreContent);
    await expect(saveGitIgnore(dir)).resolves.toBeUndefined();
    await expect(
      readFile(gitIgnorePath, { encoding: "utf8" })
    ).resolves.toEqual(`node_modules\n/build\n`);
  });
});
