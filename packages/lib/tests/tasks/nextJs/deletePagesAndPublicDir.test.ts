import { createFiles, createTempDir, deleteDir } from "../../utils";
import { deletePagesAndPublicDir } from "../../../src";
import { readdir, readFile } from "fs/promises";

describe("Test Task deletePagesAndPublicDir", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no pages or public dir", async () => {
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
  });

  test("for empty pages dir", async () => {
    createFiles(dir, { "pages/": "" });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for one file in pages dir", async () => {
    createFiles(dir, { "pages/a.ts": "fsdfdfd" });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for multiple files in pages dir", async () => {
    createFiles(dir, { "pages/a.ts": "fsdfdfd", "pages/b/c.ts": "ddsfsfd" });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for empty public dir", async () => {
    createFiles(dir, { "public/": "" });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for one file in public dir", async () => {
    createFiles(dir, { "public/a.html": "fsdfdfd" });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for multiple files in public dir", async () => {
    createFiles(dir, {
      "public/a.html": "fsdfdfd",
      "public/b/c.html": "ddsfsfd"
    });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("for multiple files in pages, public and other dir", async () => {
    createFiles(dir, {
      "pages/a.ts": "fsdfdfd",
      "pages/b/c.ts": "ddsfsfd",
      "public/a.html": "gsfdgfg",
      "public/b/c.png": "fgsdfgsfgsdfgf",
      "lib/a.ts": "sdfsdfdsdf",
      "a.json": "sfdffsdd"
    });
    await expect(deletePagesAndPublicDir(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual(["a.json", "lib"]);
    await expect(
      readFile(dir + "/a.json", { encoding: "utf8" })
    ).resolves.toEqual("sfdffsdd");
    await expect(
      readFile(dir + "/lib/a.ts", { encoding: "utf8" })
    ).resolves.toEqual("sdfsdfdsdf");
  });
});
