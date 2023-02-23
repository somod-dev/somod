/**
 * @jest-environment steps
 */

import { existsSync } from "fs";
import { unlink } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles
} from "nodejs-file-utils";
import { join } from "path";
import { execute } from "../utils";

describe("Test the create-somod", () => {
  let dir: string;
  let somodDir: string;

  beforeAll(async () => {
    dir = createTempDir("test-somod-create");
    createFiles(dir, {
      ".npmrc": "registry=http://localhost:8000\ncache=./.npm"
    });
  });

  afterEach(() => {
    if (somodDir && existsSync(somodDir)) {
      deleteDir(somodDir);
    }
  });

  afterAll(() => {
    deleteDir(dir);
  });

  test("help", async () => {
    const result = await execute(
      dir,
      "npx",
      ["create-somod", "-h"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result.stdout).toMatchSnapshot();
  });

  test("without options", async () => {
    somodDir = join(dir, "my-module");
    const result = await execute(
      dir,
      "npx",
      ["create-somod"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    deleteDir(join(somodDir, "node_modules"));
    deleteDir(join(somodDir, ".git"));
    await unlink(join(somodDir, "package-lock.json"));
    expect(readFiles(somodDir)).toMatchSnapshot();
  }, 60000);

  test(
    "with module name",
    async () => {
      somodDir = join(dir, "new-somod-module");
      const result = await execute(
        dir,
        "npx",
        ["create-somod", "new-somod-module"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result["failed"]).toBeUndefined();
      deleteDir(join(somodDir, "node_modules"));
      deleteDir(join(somodDir, ".git"));
      await unlink(join(somodDir, "package-lock.json"));
      expect(readFiles(somodDir)).toMatchSnapshot();
    },
    2 * 60000
  );

  test(
    "with out git eslint and prettier",
    async () => {
      somodDir = join(dir, "my-module");
      const result = await execute(
        dir,
        "npx",
        ["create-somod", "--no-git", "--no-eslint", "--no-prettier"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result["failed"]).toBeUndefined();
      deleteDir(join(somodDir, "node_modules"));
      deleteDir(join(somodDir, ".git"));
      await unlink(join(somodDir, "package-lock.json"));
      expect(readFiles(somodDir)).toMatchSnapshot();
    },
    2 * 60000
  );
});
