import { createFiles, createTempDir, deleteDir } from "../../utils";
import { unsetJsnextMainInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task unsetJsnextMainInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior 'jsnext:main' set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(unsetJsnextMainInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test("for 'jsnext:main' = 'index.js'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": "index.js" })
    });
    await expect(unsetJsnextMainInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test("for 'jsnext:main' = true", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": true })
    });
    await expect(unsetJsnextMainInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });

  test('for "jsnext:main" = false', async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": false })
    });
    await expect(unsetJsnextMainInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({});
  });
});
