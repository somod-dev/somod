import { createFiles, createTempDir, deleteDir } from "../../utils";
import { isValidEslintIgnore } from "../../../src";

describe("Test Util isValidEslintIgnore", () => {
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
      ".eslintignore": "node_modules\nbuild"
    });
    await expect(isValidEslintIgnore(dir)).resolves.toBeUndefined();
  });

  test("for valid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".eslintignore": "node_modules\nbuild\nbin"
    });
    await expect(isValidEslintIgnore(dir, ["bin"])).resolves.toBeUndefined();
  });

  test("for missing default path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".eslintignore": "node_modules\nbin"
    });
    await expect(isValidEslintIgnore(dir, [])).rejects.toEqual(
      new Error(`build must be in ${dir}/.eslintignore`)
    );
  });

  test("for missing default and extra path", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".eslintignore": "node_modules\n.next"
    });
    await expect(isValidEslintIgnore(dir, ["bin"])).rejects.toEqual(
      new Error(`build, bin must be in ${dir}/.eslintignore`)
    );
  });
});
