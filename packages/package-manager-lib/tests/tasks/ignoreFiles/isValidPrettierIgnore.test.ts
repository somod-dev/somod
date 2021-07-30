import { createFiles, createTempDir, deleteDir } from "../../utils";
import { isValidPrettierIgnore } from "../../../src";

describe("Test Util isValidPrettierIgnore", () => {
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
      ".prettierignore": "node_modules\nbuild"
    });
    await expect(isValidPrettierIgnore(dir)).resolves.toBeUndefined();
  });

  test("for valid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".prettierignore": "node_modules\nbuild\nbin"
    });
    await expect(isValidPrettierIgnore(dir, ["bin"])).resolves.toBeUndefined();
  });

  test("for missing default path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".prettierignore": "node_modules\nbin"
    });
    await expect(isValidPrettierIgnore(dir, [])).rejects.toEqual(
      new Error(`build must be in ${dir}/.prettierignore`)
    );
  });

  test("for missing default and extra path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".prettierignore": "node_modules\n.next"
    });
    await expect(isValidPrettierIgnore(dir, ["bin"])).rejects.toEqual(
      new Error(`build, bin must be in ${dir}/.prettierignore`)
    );
  });
});
