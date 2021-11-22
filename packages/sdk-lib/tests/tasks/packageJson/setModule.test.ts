import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setModuleInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setModuleInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior module set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setModuleInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ module: "build/index.js" });
  });

  test("for module = 'build/index.js'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ module: "build/index.js" })
    });
    await expect(setModuleInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ module: "build/index.js" });
  });

  test("for module = 'index.js'", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ module: "index.js" })
    });
    await expect(setModuleInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ module: "build/index.js" });
  });

  test("for module = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ module: true }) });
    await expect(setModuleInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ module: "build/index.js" });
  });
});
