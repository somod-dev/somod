import { createFiles, createTempDir, deleteDir } from "../../utils";
import { updateEslintIgnore } from "../../../src";
import { readIgnoreFileStore } from "@sodaru-cli/base";
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
    await expect(updateEslintIgnore(dir, [])).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".eslintignore"))
    ).resolves.toEqual(["node_modules", "build"]);
  });

  test("for existing file", async () => {
    createFiles(dir, {
      ".eslintignore": "node_modules\nbin"
    });
    await expect(updateEslintIgnore(dir, [])).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".eslintignore"))
    ).resolves.toEqual(["node_modules", "bin", "build"]);
  });

  test("for existing file with extra paths", async () => {
    createFiles(dir, {
      ".eslintignore": "node_modules\nbin"
    });
    await expect(
      updateEslintIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".eslintignore"))
    ).resolves.toEqual(["node_modules", "bin", "build", ".next"]);
  });

  test("for existing file with empty lines", async () => {
    createFiles(dir, {
      ".eslintignore": "\nnode_modules\n\nbin"
    });
    await expect(
      updateEslintIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".eslintignore"))
    ).resolves.toEqual(["", "node_modules", "", "bin", "build", ".next"]);
  });
});
