import { createFiles, createTempDir, deleteDir } from "../../utils";
import { watchRootModulePages, watchRootModulePagesData } from "../../../src";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { helper, sleep } from "../../utils/watch.test";

describe("Test Task watchRootModulePagesData", () => {
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
    closeHandle = await watchRootModulePagesData(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for no ui/pages-data dir", async () => {
    createFiles(dir, { "ui/": "" });
    await sleep(100);
    closeHandle = await watchRootModulePagesData(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for empty ui/pages-data dir", async () => {
    createFiles(dir, { "ui/pages-data/": "" });
    await sleep(100);
    closeHandle = await watchRootModulePagesData(dir);
    await sleep(100);
    expect(existsSync(dir + "/pages")).toBeFalsy();
  });

  test("for existing page-data", async () => {
    createFiles(dir, {
      "ui/pages-data/a.ts": "export const getStaticPaths = () => {}"
    });
    await sleep(100);
    closeHandle = await watchRootModulePagesData(dir);
    await sleep(100);

    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();
  });

  test("for pages data without page", async () => {
    await sleep(100);
    const closePageWatch = await watchRootModulePages(dir);
    await sleep(100);
    const closePageDataWatch = await watchRootModulePagesData(dir);
    await sleep(100);

    closeHandle = () => {
      closePageDataWatch();
      closePageWatch();
    };

    // new file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages-data"));
    await helper.createFile(
      join(dir, "ui/pages-data/a.ts"),
      "export const getStaticPaths = () => {}"
    );

    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();
  });

  test("for new pages-data after watch", async () => {
    // start watching
    const closePageWatch = await watchRootModulePages(dir);
    await sleep(100);
    const closePageDataWatch = await watchRootModulePagesData(dir);
    await sleep(100);

    closeHandle = () => {
      closePageDataWatch();
      closePageWatch();
    };

    // new file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages"));
    await helper.createFile(
      join(dir, "ui/pages/a.tsx"),
      "const A = 10; export default A;"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');

    // create data file
    await helper.createDir(join(dir, "ui/pages-data"));
    await helper.createFile(
      join(dir, "ui/pages-data/a.ts"),
      "export const getStaticPaths = () => {};"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export { default } from "../ui/pages/a";\nexport { getStaticPaths } from "../ui/pages-data/a";'
    );

    // delete data file
    await helper.deleteFile(join(dir, "ui/pages-data/a.ts"));
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');

    // delete page file
    await helper.deleteFile(join(dir, "ui/pages/a.tsx"));
    expect(existsSync(join(dir, "pages", "a.ts"))).toBeFalsy();
  });

  test("for wrong content in pages after watch", async () => {
    // mock
    // eslint-disable-next-line no-console
    const original = console.error;
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    // start watching
    const closePageWatch = await watchRootModulePages(dir);
    await sleep(100);
    const closePageDataWatch = await watchRootModulePagesData(dir);
    await sleep(100);

    closeHandle = () => {
      closePageDataWatch();
      closePageWatch();
    };

    // create page
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/pages"));
    await helper.createFile(
      join(dir, "ui/pages/a.tsx"),
      "const A = 10; export default A;"
    );

    // create page-data with error
    await helper.createDir(join(dir, "ui/pages-data"));
    await helper.createFile(
      join(dir, "ui/pages-data/a.ts"),
      "export const getStaticPaths = () => {}; const C = "
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Expression expected."
      })
    );

    // correct file
    await helper.createFile(
      join(dir, "ui/pages-data/a.ts"),
      "export const getStaticPaths = () => {};"
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export { default } from "../ui/pages/a";\nexport { getStaticPaths } from "../ui/pages-data/a";'
    );

    // again currupt file
    await helper.createFile(
      join(dir, "ui/pages-data/a.ts"),
      "export const getStaticPaths = () => {}; const B="
    );
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export { default } from "../ui/pages/a";\nexport { getStaticPaths } from "../ui/pages-data/a";'
    );
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Expression expected."
      })
    );

    // eslint-disable-next-line no-console
    console.error = original;
  });
});
