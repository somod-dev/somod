import { createFiles, createTempDir, deleteDir } from "../../utils";
import { createRootModulePages } from "../../../src";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test Task createRootModulePages", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no ui dir", async () => {
    await expect(createRootModulePages(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for no ui/pages dir", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(createRootModulePages(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for empty ui/pages dir", async () => {
    createFiles(dir, { "ui/pages/": "" });
    await expect(createRootModulePages(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for one page", async () => {
    createFiles(dir, { "ui/pages/a.ts": "const A = 10; export default A;" });
    await expect(createRootModulePages(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
  });

  test("for multiple pages", async () => {
    createFiles(dir, {
      "ui/pages/a.ts": "const A = 10; export default A;",
      "ui/pages/b/c.ts": "export const C = 10;"
    });
    await expect(createRootModulePages(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
    await expect(
      readFile(join(dir, "pages", "b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { C } from "../../ui/pages/b/c";');
  });
});
