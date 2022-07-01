import { createFiles, createTempDir, deleteDir } from "../../utils";
import { deleteBuildDir } from "../../../src";
import { readdir, readFile } from "fs/promises";

describe("Test Task deleteBuildDir", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no build dir", async () => {
    await expect(deleteBuildDir(dir)).resolves.toBeUndefined();
  });

  test("for empty build dir", async () => {
    createFiles(dir, { "build/": "" });
    await expect(deleteBuildDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for one file in build dir", async () => {
    createFiles(dir, { "build/a.js": "fsdfdfd" });
    await expect(deleteBuildDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for multiple files in build dir", async () => {
    createFiles(dir, { "build/a.js": "fsdfdfd", "build/b/c.js": "ddsfsfd" });
    await expect(deleteBuildDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for multiple files in build dir and other dir", async () => {
    createFiles(dir, {
      "build/a.js": "fsdfdfd",
      "build/b/c.js": "ddsfsfd",
      "lib/a.ts": "sdfsdfdsdf",
      "a.json": "sfdffsdd"
    });
    await expect(deleteBuildDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual(["a.json", "lib"]);
    await expect(
      readFile(dir + "/a.json", { encoding: "utf8" })
    ).resolves.toEqual("sfdffsdd");
    await expect(
      readFile(dir + "/lib/a.ts", { encoding: "utf8" })
    ).resolves.toEqual("sdfsdfdsdf");
  });
});
