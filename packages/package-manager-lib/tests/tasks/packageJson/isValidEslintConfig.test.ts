import { createFiles, createTempDir, deleteDir } from "../../utils";
import { isValidEslintConfigInPackageJson } from "../../../src";

describe("Test Task isValidEslintConfigInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no eslintConfig set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {extends: [ '@sodaru/eslint-config']}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: ["@sodaru/eslint-config"] }
      })
    });
    await expect(
      isValidEslintConfigInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for eslintConfig = '@sodaru/eslint-config'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ eslintConfig: "@sodaru/eslint-config" })
    });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ eslintConfig: {} })
    });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {config: '@sodaru/config'}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { config: "@sodaru/eslint-config" }
      })
    });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {extends: []}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: [] }
      })
    });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {extends: ['a', '@sodaru/eslint-config']}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: ["a", "@sodaru/eslint-config"] }
      })
    });
    await expect(isValidEslintConfigInPackageJson(dir)).rejects.toEqual(
      new Error(
        `eslintConfig.extends[0] must be '@sodaru/eslint-config' in ${dir}/package.json`
      )
    );
  });

  test("for eslintConfig = {extends: ['@sodaru/eslint-config', 'a'], rules: {'no-console':0}}", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: {
          extends: ["@sodaru/eslint-config", "a"],
          rules: { "no-console": 2 }
        }
      })
    });
    await expect(
      isValidEslintConfigInPackageJson(dir)
    ).resolves.toBeUndefined();
  });
});
