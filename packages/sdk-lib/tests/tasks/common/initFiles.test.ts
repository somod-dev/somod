/* eslint-disable no-console */
import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { listFiles } from "@solib/cli-base";
import { initFiles } from "../../../src";
import { yellow } from "chalk";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test task initFiles", () => {
  let dir: string = null;
  const originalWarn = console.warn;

  beforeEach(() => {
    dir = createTempDir();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.warn = originalWarn;
    deleteDir(dir);
  });

  test("only common", async () => {
    const result = await initFiles(dir, false, false);
    expect(result).toBeUndefined();
    const downloadedFiles = await listFiles(dir);
    expect(downloadedFiles).toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test("only ui", async () => {
    const result = await initFiles(dir, true, false);
    expect(result).toBeUndefined();
    const downloadedFiles = await listFiles(dir);
    expect(downloadedFiles).toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test("only serverless", async () => {
    const result = await initFiles(dir, false, true);
    expect(result).toBeUndefined();
    const downloadedFiles = await listFiles(dir);
    expect(downloadedFiles).toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test("for empty dir", async () => {
    const result = await initFiles(dir, true, true);
    expect(result).toBeUndefined();
    const downloadedFiles = await listFiles(dir);
    expect(downloadedFiles).toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  test("for non-empty dir", async () => {
    createFiles(dir, { "lib/index.ts": "" });
    const result = await initFiles(dir, true, true);
    expect(result).toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      yellow("lib/index.ts exists : SKIPPED")
    );
    await expect(
      readFile(join(dir, "lib/index.ts"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });

  test("for forcing replacement in non-empty dir", async () => {
    createFiles(dir, { "lib/index.ts": "" });
    const result = await initFiles(dir, true, true, true);
    expect(result).toBeUndefined();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      yellow("lib/index.ts exists : REPLACED")
    );
    await expect(
      readFile(join(dir, "lib/index.ts"), { encoding: "utf8" })
    ).resolves.not.toEqual("");
  });
});
