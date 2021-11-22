import { createFiles, createTempDir, deleteDir } from "../../utils";
import { unsetTypeInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task unsetTypeInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior 'type' set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(unsetTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test("for 'type' = 'module'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ type: "module" })
    });
    await expect(unsetTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test("for 'type' = 'commonjs'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ type: "commonjs" })
    });
    await expect(unsetTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });
  test("for 'type' = true", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ type: true })
    });
    await expect(unsetTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test('for "type" = false', async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ type: false })
    });
    await expect(unsetTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });
});
