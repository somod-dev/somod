import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setPrettierConfigInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setPrettierConfigInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior prettier set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setPrettierConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      prettier: "@sodaru/prettier-config"
    });
  });

  test("for prettier = '@sodaru/prettier-config'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ prettier: "@sodaru/prettier-config" })
    });
    await expect(setPrettierConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      prettier: "@sodaru/prettier-config"
    });
  });

  test("for prettier = 'index.js'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ prettier: "index.js" })
    });
    await expect(setPrettierConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      prettier: "@sodaru/prettier-config"
    });
  });

  test("for prettier = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ prettier: true }) });
    await expect(setPrettierConfigInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({
      prettier: "@sodaru/prettier-config"
    });
  });
});
