import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesTypeIsNotSetInPackageJson } from "../../../src";

describe("Test Task doesTypeIsNotSetInPackageJson", () => {
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
    await expect(doesTypeIsNotSetInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for type = 'module'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ type: "module" })
    });
    await expect(doesTypeIsNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`type must not be set in ${dir}/package.json`)
    );
  });

  test("for type = 'commonjs'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ type: "commonjs" })
    });
    await expect(doesTypeIsNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`type must not be set in ${dir}/package.json`)
    );
  });

  test("for type = false", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ type: false })
    });
    await expect(doesTypeIsNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`type must not be set in ${dir}/package.json`)
    );
  });

  test("for type = null", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ type: null })
    });
    await expect(doesTypeIsNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`type must not be set in ${dir}/package.json`)
    );
  });
});
