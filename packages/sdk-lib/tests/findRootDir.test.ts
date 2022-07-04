import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { join } from "path";
import { findRootDir } from "../src";

describe("test findRootDir", () => {
  let dir: string;
  const originalCwd = process.cwd;

  beforeEach(() => {
    dir = createTempDir();
    process.cwd = () => dir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    deleteDir(dir);
  });

  test("for invalid directory", () => {
    expect(() => findRootDir()).toThrowError(
      new Error("fatal: not a npm package (or any of the parent directories)")
    );
  });

  test("for valid directory at the root", () => {
    createFiles(dir, { "package.json": "" });
    expect(findRootDir()).toEqual(dir);
  });

  test("for valid directory at the child", () => {
    createFiles(dir, { "a/package.json": "", "a/b/c/": "" });
    process.cwd = () => join(dir, "a/b/c");
    expect(findRootDir()).toEqual(join(dir, "a"));
  });
});
