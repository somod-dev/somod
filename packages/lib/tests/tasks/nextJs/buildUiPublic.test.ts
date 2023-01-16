import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { IContext } from "somod-types";
import { buildUiPublic } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task buildUiPublic", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no ui dir", async () => {
    await expect(buildUiPublic({ dir } as IContext)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for no public dir", async () => {
    createFiles(dir, { "ui/": "" });
    await expect(buildUiPublic({ dir } as IContext)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for empty public dir", async () => {
    createFiles(dir, { "ui/public/": "" });
    await expect(buildUiPublic({ dir } as IContext)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build/public"))).toBeFalsy();
  });

  test("for valid public dir", async () => {
    createFiles(dir, {
      "ui/public/a.css": "a {color: #090909}",
      "ui/public/b.css": "a {margin: 5}",
      "ui/public/f1/a.css": "a {top: 5}"
    });
    await expect(buildUiPublic({ dir } as IContext)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/ui/public/a.css"), { encoding: "utf8" })
    ).resolves.toEqual("a {color: #090909}");
    await expect(
      readFile(join(dir, "build/ui/public/b.css"), { encoding: "utf8" })
    ).resolves.toEqual("a {margin: 5}");

    await expect(
      readFile(join(dir, "build/ui/public/f1/a.css"), { encoding: "utf8" })
    ).resolves.toEqual("a {top: 5}");
  });
});
