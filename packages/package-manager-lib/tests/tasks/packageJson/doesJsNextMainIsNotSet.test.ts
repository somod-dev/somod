import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesJsnextMainNotSetInPackageJson } from "../../../src";

describe("Test Task doesJsnextMainNotSetInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no jsnext:main set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(
      doesJsnextMainNotSetInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for jsnext:main = 'index.js'", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": "index.js" })
    });
    await expect(doesJsnextMainNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`jsnext:main must not be set in ${dir}/package.json`)
    );
  });

  test("for jsnext:main = false", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": false })
    });
    await expect(doesJsnextMainNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`jsnext:main must not be set in ${dir}/package.json`)
    );
  });

  test("for jsnext:main = null", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ "jsnext:main": null })
    });
    await expect(doesJsnextMainNotSetInPackageJson(dir)).rejects.toEqual(
      new Error(`jsnext:main must not be set in ${dir}/package.json`)
    );
  });
});
