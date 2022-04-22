import { createFiles, createTempDir, deleteDir } from "../../utils";
import { createRootModulePublicAssets } from "../../../src";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test Task createRootModulePublicAssets", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no ui dir", async () => {
    await expect(createRootModulePublicAssets(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for no ui/public dir", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(createRootModulePublicAssets(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for empty ui/public dir", async () => {
    createFiles(dir, { "ui/public/": "" });
    await expect(createRootModulePublicAssets(dir)).resolves.toBeUndefined();
    expect(existsSync(dir + "/public")).toBeFalsy();
  });

  test("for one public asset", async () => {
    createFiles(dir, { "ui/public/a.html": "dfhiewhfhweh" });
    await expect(createRootModulePublicAssets(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("dfhiewhfhweh");
  });

  test("for multiple public assets", async () => {
    createFiles(dir, {
      "ui/public/a.html": "djfhewriohfiohoirfr",
      "ui/public/b/c.html": "dsshjrhoerjowjjer"
    });
    await expect(createRootModulePublicAssets(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("djfhewriohfiohoirfr");
    await expect(
      readFile(join(dir, "public", "b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("dsshjrhoerjowjjer");
  });
});
