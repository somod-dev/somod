import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { initLib } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initLib", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no libPage", async () => {
    await expect(initLib(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "lib/index.ts"))).toBeTruthy();
  });

  test("for prior libPage", async () => {
    createFiles(dir, { "lib/index.ts": "" });
    await expect(initLib(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "lib/index.ts"))).toBeTruthy();
    await expect(
      readFile(join(dir, "lib/index.ts"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });
});
