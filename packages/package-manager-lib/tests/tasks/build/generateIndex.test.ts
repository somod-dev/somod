import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { generateIndex } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task generatePagesIndex", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no build dir", async () => {
    await expect(generateIndex(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for empty ui and lib dirs", async () => {
    createFiles(dir, { "build/ui/": "", "build/lib/": "" });
    await expect(generateIndex(dir)).resolves.toBeUndefined();
    await expect(readdir(join(dir, "build"))).resolves.toEqual(["lib", "ui"]);
  });

  test("for ui/pageIndex.js only", async () => {
    createFiles(dir, {
      "build/ui/pageIndex.js": "export const Page1default = 10;"
    });
    await expect(generateIndex(dir, ["ui/pageIndex"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/index.js"), { encoding: "utf8" })
    ).resolves.toEqual('export * from "./ui/pageIndex";');
    await expect(
      readFile(join(dir, "build/index.d.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export * from "./ui/pageIndex";');
  });

  test("for lib/index.js only", async () => {
    createFiles(dir, { "build/lib/index.js": "export const Index = 20;" });
    await expect(generateIndex(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/index.js"), { encoding: "utf8" })
    ).resolves.toEqual('export * from "./lib";');
    await expect(
      readFile(join(dir, "build/index.d.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export * from "./lib";');
  });

  test("for both ui/pageIndex.js and lib/index.js", async () => {
    createFiles(dir, {
      "build/ui/pageIndex.js": "export const Page1default = 10;",
      "build/lib/index.js": "export const Welcome = 10; export default Welcome;"
    });
    await expect(generateIndex(dir, ["ui/pageIndex"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/index.js"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export * from "./lib";\nexport * from "./ui/pageIndex";'
    );
    await expect(
      readFile(join(dir, "build/index.d.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export * from "./lib";\nexport * from "./ui/pageIndex";'
    );
  });

  test("for both ui/pageIndex.js and lib/index.js without named exports", async () => {
    createFiles(dir, {
      "build/ui/pageIndex.js":
        "const Page1default = 10; export default Page1default",
      "build/lib/index.js": ""
    });
    await expect(generateIndex(dir, ["ui/pageIndex"])).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build/index.js"))).not.toBeTruthy();
    expect(existsSync(join(dir, "build/index.d.ts"))).not.toBeTruthy();
  });
});
