import { createFiles, createTempDir, deleteDir } from "../../utils";

import { exportRootModulePage } from "../../../src/utils/nextJs/pages";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test Util pages.exportRootModulePage", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no dir", async () => {
    await expect(exportRootModulePage(null, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for no page", async () => {
    await expect(exportRootModulePage(dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing dir", async () => {
    const _dir = __dirname + "/sldkfjkljflkerjl";
    await expect(exportRootModulePage(_dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing page", async () => {
    await expect(exportRootModulePage(dir, "a.ts")).rejects.toMatchObject({
      message: expect.stringContaining("no such file or directory, open ")
    });
  });

  test("for page no exports", async () => {
    createFiles(dir, { "ui/pages/a.ts": "" });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export {  } from "../ui/pages/a";');
  });

  test("for page with only default exports", async () => {
    createFiles(dir, { "ui/pages/a.ts": "const A = 10; export default A;" });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
  });

  test("for page with only named exports", async () => {
    createFiles(dir, {
      "ui/pages/a.ts": "export const A = 10; export const B = 20;"
    });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { A, B } from "../ui/pages/a";');
  });

  test("for page with default and named exports", async () => {
    createFiles(dir, {
      "ui/pages/a.ts":
        "export const A = 10; export const B = 20; export default A;"
    });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default, A, B } from "../ui/pages/a";');
  });

  test("for deep page", async () => {
    createFiles(dir, {
      "ui/pages/a/b/c.ts":
        "export const A = 10; export const B = 20; export default A;"
    });
    await expect(
      exportRootModulePage(dir, "a/b/c.ts")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a/b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export { default, A, B } from "../../../ui/pages/a/b/c";'
    );
  });
});
