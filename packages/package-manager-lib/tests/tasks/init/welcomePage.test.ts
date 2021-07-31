import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { initWelcomePage } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initWelcomePage", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no welcomePage", async () => {
    await expect(initWelcomePage(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "ui/pages/index.tsx"))).toBeTruthy();
  });

  test("for prior welcomePage", async () => {
    createFiles(dir, { "ui/pages/index.tsx": "" });
    await expect(initWelcomePage(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "ui/pages/index.tsx"))).toBeTruthy();
    await expect(
      readFile(join(dir, "ui/pages/index.tsx"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });
});
