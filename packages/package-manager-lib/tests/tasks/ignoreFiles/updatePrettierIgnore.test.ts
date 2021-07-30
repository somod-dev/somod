import { createFiles, createTempDir, deleteDir } from "../../utils";
import { updatePrettierIgnore } from "../../../src";
import { read } from "../../../src/utils/ignoreFileStore";
import { join } from "path";

describe("Test Util ignoreFile.update", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for non existing file", async () => {
    await expect(updatePrettierIgnore(dir, [])).resolves.toBeUndefined();
    await expect(read(join(dir, ".prettierignore"))).resolves.toEqual([
      "node_modules",
      "build"
    ]);
  });

  test("for existing file", async () => {
    createFiles(dir, {
      ".prettierignore": "node_modules\nbin"
    });
    await expect(updatePrettierIgnore(dir, [])).resolves.toBeUndefined();
    await expect(read(join(dir, ".prettierignore"))).resolves.toEqual([
      "node_modules",
      "bin",
      "build"
    ]);
  });

  test("for existing file with extra paths", async () => {
    createFiles(dir, {
      ".prettierignore": "node_modules\nbin"
    });
    await expect(
      updatePrettierIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(read(join(dir, ".prettierignore"))).resolves.toEqual([
      "node_modules",
      "bin",
      "build",
      ".next"
    ]);
  });

  test("for existing file with empty lines", async () => {
    createFiles(dir, {
      ".prettierignore": "\nnode_modules\n\nbin"
    });
    await expect(
      updatePrettierIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(read(join(dir, ".prettierignore"))).resolves.toEqual([
      "",
      "node_modules",
      "",
      "bin",
      "build",
      ".next"
    ]);
  });
});
