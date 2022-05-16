import { createFiles, createTempDir, deleteDir } from "../../utils";
import { updateVercelIgnore } from "../../../src";
import { readIgnoreFileStore } from "@solib/cli-base";
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
    await expect(updateVercelIgnore(dir, [])).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".vercelignore"))
    ).resolves.toEqual(["node_modules", "build"]);
  });

  test("for existing file", async () => {
    createFiles(dir, {
      ".vercelignore": "node_modules\nbin"
    });
    await expect(updateVercelIgnore(dir, [])).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".vercelignore"))
    ).resolves.toEqual(["node_modules", "bin", "build"]);
  });

  test("for existing file with extra paths", async () => {
    createFiles(dir, {
      ".vercelignore": "node_modules\nbin"
    });
    await expect(
      updateVercelIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".vercelignore"))
    ).resolves.toEqual(["node_modules", "bin", "build", ".next"]);
  });

  test("for existing file with empty lines", async () => {
    createFiles(dir, {
      ".vercelignore": "\nnode_modules\n\nbin"
    });
    await expect(
      updateVercelIgnore(dir, ["bin", ".next"])
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".vercelignore"))
    ).resolves.toEqual(["", "node_modules", "", "bin", "build", ".next"]);
  });
});
