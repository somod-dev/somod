import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setEslintConfigInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setEslintConfigInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no eslintConfig set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: { extends: ["@sodaru/eslint-config"] }
    });
  });

  test("for eslintConfig = {extends: [ '@sodaru/eslint-config']}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: ["@sodaru/eslint-config"] }
      })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: { extends: ["@sodaru/eslint-config"] }
    });
  });

  test("for eslintConfig = '@sodaru/eslint-config'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ eslintConfig: "@sodaru/eslint-config" })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: { extends: ["@sodaru/eslint-config"] }
    });
  });

  test("for eslintConfig = {}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ eslintConfig: {} })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: { extends: ["@sodaru/eslint-config"] }
    });
  });

  test("for eslintConfig = {config: '@sodaru/config'}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { config: "@sodaru/eslint-config" }
      })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: {
        config: "@sodaru/eslint-config",
        extends: ["@sodaru/eslint-config"]
      }
    });
  });

  test("for eslintConfig = {extends: []}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: [] }
      })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: { extends: ["@sodaru/eslint-config"] }
    });
  });

  test("for eslintConfig = {extends: ['a', '@sodaru/eslint-config']}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: { extends: ["a", "@sodaru/eslint-config"] }
      })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: {
        extends: ["@sodaru/eslint-config", "a", "@sodaru/eslint-config"]
      }
    });
  });

  test("for eslintConfig = {extends: ['@sodaru/eslint-config', 'a'], rules: {'no-console':0}}", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        eslintConfig: {
          extends: ["@sodaru/eslint-config", "a"],
          rules: { "no-console": 2 }
        }
      })
    });
    await expect(setEslintConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      eslintConfig: {
        extends: ["@sodaru/eslint-config", "a"],
        rules: { "no-console": 2 }
      }
    });
  });
});
