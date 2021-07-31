import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";
import { initGit } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initGit", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no .git dir", async () => {
    await expect(initGit(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".git"))).toBeTruthy();
    expect((await readdir(join(dir, ".git"))).length).toBeGreaterThan(0);
  });

  test("for prior .git dir", async () => {
    createFiles(dir, { ".git/": "" });
    await expect(initGit(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".git"))).toBeTruthy();
    expect((await readdir(join(dir, ".git"))).length).toEqual(0);
  });
});
