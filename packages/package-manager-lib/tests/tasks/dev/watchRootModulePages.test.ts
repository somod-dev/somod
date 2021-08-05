import { createFiles, createTempDir, deleteDir } from "../../utils";
import { watchRootModulePages } from "../../../src";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { helper, sleep } from "../../utils/watch.test";

describe("Test Task watchRootModulePages", () => {
  let dir: string = null;
  let closeHandle: () => void = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
    closeHandle();
  });

  test("for no ui dir", async () => {
    closeHandle = watchRootModulePages(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for no ui/pages dir", async () => {
    createFiles(dir, { "ui/": "" });
    await sleep(100);
    closeHandle = watchRootModulePages(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for empty ui/pages dir", async () => {
    createFiles(dir, { "ui/pages/": "" });
    await sleep(100);
    closeHandle = watchRootModulePages(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for existing page", async () => {
    createFiles(dir, { "ui/pages/a.ts": "const A = 10; export default A;" });
    await sleep(100);
    closeHandle = watchRootModulePages(dir);
    await sleep(100);

    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();
  });

  test("for new pages after watch", async () => {
    // start watching
    closeHandle = watchRootModulePages(dir);
    await sleep(100);

    // new file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages"));
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');

    // another new deep file
    expect(existsSync(join(dir, "pages", "b/c.ts"))).toBeFalsy();
    await helper.createDir(join(dir, "ui/pages/b"));
    await helper.createFile(
      join(dir, "ui/pages/b/c.ts"),
      "export const A = 10;"
    );
    await expect(
      readFile(join(dir, "pages", "b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { A } from "../../ui/pages/b/c";');

    // update file
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "export const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default, A } from "../ui/pages/a";');

    // update another  deep file
    await helper.createFile(
      join(dir, "ui/pages/b/c.ts"),
      "const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../../ui/pages/b/c";');

    // delete file
    await helper.deleteFile(join(dir, "ui/pages/a.ts"));
    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();

    // delete another deep file
    await helper.deleteFile(join(dir, "ui/pages/b/c.ts"));
    expect(existsSync(join(dir, "pages", "b/c.ts"))).toBeFalsy();
  });

  test("for wrong content in pages after watch", async () => {
    // mock
    // eslint-disable-next-line no-console
    const original = console.error;
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    // start watching
    closeHandle = watchRootModulePages(dir);
    await sleep(100);

    // save file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages"));
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "const A = 10; export default A; const C ="
    );
    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Expression expected."
      })
    );

    // correct file
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');

    // again currupt file
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "const A = 10; export default A; const B="
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledTimes(2);
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Expression expected."
      })
    );

    // eslint-disable-next-line no-console
    console.error = original;
  });

  test("for pre-existing pages dir", async () => {
    createFiles(dir, {
      "pages/a.ts": 'export { default } from "m1";',
      "pages/b/c.ts": 'export { A } from "m2";'
    });

    sleep(100);

    // start watching
    closeHandle = watchRootModulePages(dir);
    await sleep(100);

    // create file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages"));
    await helper.createFile(
      join(dir, "ui/pages/a.ts"),
      "export const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default, A } from "../ui/pages/a";');

    // create another deep file
    await helper.createDir(join(dir, "ui/pages/b"));
    await helper.createFile(
      join(dir, "ui/pages/b/c.ts"),
      "const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../../ui/pages/b/c";');

    // delete file
    await helper.deleteFile(join(dir, "ui/pages/a.ts"));
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "m1";');

    // delete another deep file
    await helper.deleteFile(join(dir, "ui/pages/b/c.ts"));
    await expect(
      readFile(join(dir, "pages", "b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { A } from "m2";');
  });
});
