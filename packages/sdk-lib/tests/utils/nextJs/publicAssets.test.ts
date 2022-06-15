import { createFiles, createTempDir, deleteDir } from "../../utils";
import { exportRootModulePublicAsset } from "../../../src/utils/nextJs/publicAssets";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test Util publicAssets.exportRootModulePublicAsset", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no dir", async () => {
    await expect(
      exportRootModulePublicAsset(null, null)
    ).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for no publicAsset", async () => {
    await expect(exportRootModulePublicAsset(dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing dir", async () => {
    const _dir = __dirname + "/sldkfjkljflkerjl";
    await expect(
      exportRootModulePublicAsset(_dir, null)
    ).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing publicAsset", async () => {
    await expect(
      exportRootModulePublicAsset(dir, "a.html")
    ).rejects.toMatchObject({
      message: expect.stringContaining("no such file or directory, copyfile ")
    });
  });

  test("for valid asset", async () => {
    createFiles(dir, { "ui/public/a.html": "dfhdsjfhkjadshklfshd" });
    await expect(
      exportRootModulePublicAsset(dir, "a.html")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("dfhdsjfhkjadshklfshd");
  });

  test("for deep asset", async () => {
    createFiles(dir, { "ui/public/a/b/c.html": "iurroqieworhqo" });
    await expect(
      exportRootModulePublicAsset(dir, "a/b/c.html")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a/b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("iurroqieworhqo");
  });
});
