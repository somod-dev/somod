import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesModuleIsBuildIndexInPackageJson } from "../../../src";

describe("Test Task doesModuleIsBuildIndexInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no module set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesModuleIsBuildIndexInPackageJson(dir)).rejects.toEqual(
      new Error(`module must be 'build/index.js' in ${dir}/package.json`)
    );
  });

  test("for module = 'build/index.js'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ module: "build/index.js" })
    });
    await expect(
      doesModuleIsBuildIndexInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for module = 'index.js'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ module: "index.js" })
    });
    await expect(doesModuleIsBuildIndexInPackageJson(dir)).rejects.toEqual(
      new Error(`module must be 'build/index.js' in ${dir}/package.json`)
    );
  });

  test("for module = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ module: true }) });
    await expect(doesModuleIsBuildIndexInPackageJson(dir)).rejects.toEqual(
      new Error(`module must be 'build/index.js' in ${dir}/package.json`)
    );
  });
});
