import { createFiles, createTempDir, deleteDir } from "../../utils";
import { isValidPrettierConfigInPackageJson } from "../../../src";

describe("Test Task isValidPrettierConfigInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prettier set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(isValidPrettierConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `prettier must be '@sodaru/prettier-config' in ${dir}/package.json`
      )
    );
  });

  test("for prettier = '@sodaru/prettier-config'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        prettier: "@sodaru/prettier-config"
      })
    });
    await expect(
      isValidPrettierConfigInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for prettier = {extends: [ '@sodaru/prettier-config']}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        prettier: { extends: ["@sodaru/prettier-config"] }
      })
    });
    await expect(isValidPrettierConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `prettier must be '@sodaru/prettier-config' in ${dir}/package.json`
      )
    );
  });

  test("for prettier = {}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ prettier: {} })
    });
    await expect(isValidPrettierConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `prettier must be '@sodaru/prettier-config' in ${dir}/package.json`
      )
    );
  });
});
