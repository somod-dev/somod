import { createFiles, createTempDir, deleteDir } from "../../utils";
import { watchRootModulePublicAssets } from "../../../src";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { helper, sleep } from "../../utils/watch.test";

describe("Test Task watchRootModulePublicAssets", () => {
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
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for no ui/public dir", async () => {
    createFiles(dir, { "ui/": "" });
    await sleep(100);
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for empty ui/public dir", async () => {
    createFiles(dir, { "ui/public/": "" });
    await sleep(100);
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for existing public asset", async () => {
    createFiles(dir, { "ui/public/a.html": "dkjfhdsfkadhk" });
    await sleep(100);
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);

    expect(existsSync(join(dir, "public", "a.html"))).toBeFalsy();
  });

  test("for new public after watch", async () => {
    // start watching
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);

    // new file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/public"));
    await helper.createFile(
      join(dir, "ui/public/a.html"),
      "hkjrhehfiherfherhhu"
    );
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("hkjrhehfiherfherhhu");

    // another new deep file
    expect(existsSync(join(dir, "public", "b/c.html"))).toBeFalsy();
    await helper.createDir(join(dir, "ui/public/b"));
    await helper.createFile(
      join(dir, "ui/public/b/c.html"),
      "kjljlelrjlejlrjljwelk"
    );
    await expect(
      readFile(join(dir, "public", "b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("kjljlelrjlejlrjljwelk");

    // update file
    await helper.createFile(
      join(dir, "ui/public/a.html"),
      "eehrqhreorhewhkrqhe"
    );
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("eehrqhreorhewhkrqhe");

    // update another  deep file
    await helper.createFile(
      join(dir, "ui/public/b/c.html"),
      "utrhwihhkcnejndiwqojjwjob"
    );
    await expect(
      readFile(join(dir, "public", "b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("utrhwihhkcnejndiwqojjwjob");

    // delete file
    await helper.deleteFile(join(dir, "ui/public/a.html"));
    expect(existsSync(join(dir, "public", "a.html"))).toBeFalsy();

    // delete another deep file
    await helper.deleteFile(join(dir, "ui/public/b/c.html"));
    expect(existsSync(join(dir, "public", "b/c.html"))).toBeFalsy();
  });

  test("for pre-existing public dir", async () => {
    createFiles(dir, {
      "public/a.html": "aaaaaaaaaaaaaaa",
      "public/b/c.html": "ccccccccccccccccc"
    });

    sleep(100);

    // start watching
    closeHandle = watchRootModulePublicAssets(dir);
    await sleep(100);

    // create file
    await helper.createDir(join(dir, "ui"));
    await helper.createDir(join(dir, "ui/public"));
    await helper.createFile(
      join(dir, "ui/public/a.html"),
      "dskfhwehfohehiowhje"
    );
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("dskfhwehfohehiowhje");

    // create another deep file
    await helper.createDir(join(dir, "ui/public/b"));
    await helper.createFile(
      join(dir, "ui/public/b/c.html"),
      "lkjdfjfljlsdjljlkdjsfj"
    );
    await expect(
      readFile(join(dir, "public", "b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("lkjdfjfljlsdjljlkdjsfj");

    // delete file
    await helper.deleteFile(join(dir, "ui/public/a.html"));
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("aaaaaaaaaaaaaaa");

    // delete another deep file
    await helper.deleteFile(join(dir, "ui/public/b/c.html"));
    await expect(
      readFile(join(dir, "public", "b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("ccccccccccccccccc");
  });
});
