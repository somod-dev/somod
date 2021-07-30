import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesTypeIsModuleInPackageJson } from "../../../src";

describe("Test Task doesTypeIsModuleInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no type set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesTypeIsModuleInPackageJson(dir)).rejects.toEqual(
      new Error(`type must be 'module' in ${dir}/package.json`)
    );
  });

  test("for type = 'module'", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ type: "module" }) });
    await expect(doesTypeIsModuleInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for type = 'cjs'", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ type: "cjs" }) });
    await expect(doesTypeIsModuleInPackageJson(dir)).rejects.toEqual(
      new Error(`type must be 'module' in ${dir}/package.json`)
    );
  });

  test("for type = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ type: true }) });
    await expect(doesTypeIsModuleInPackageJson(dir)).rejects.toEqual(
      new Error(`type must be 'module' in ${dir}/package.json`)
    );
  });
});
