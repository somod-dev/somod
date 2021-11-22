import { createFiles, createTempDir, deleteDir } from "../../utils";
import { isValidGitIgnore } from "../../../src";

describe("Test Util isValidGitIgnore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for valid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".gitignore": "node_modules\nbuild"
    });
    await expect(isValidGitIgnore(dir)).resolves.toBeUndefined();
  });

  test("for valid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".gitignore": "node_modules\nbuild\nbin"
    });
    await expect(isValidGitIgnore(dir, ["bin"])).resolves.toBeUndefined();
  });

  test("for missing default path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".gitignore": "node_modules\nbin"
    });
    await expect(isValidGitIgnore(dir, [])).rejects.toEqual(
      new Error(`build must be in ${dir}/.gitignore`)
    );
  });

  test("for missing default and extra path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".gitignore": "node_modules\n.next"
    });
    await expect(isValidGitIgnore(dir, ["bin"])).rejects.toEqual(
      new Error(`build, bin must be in ${dir}/.gitignore`)
    );
  });
});
