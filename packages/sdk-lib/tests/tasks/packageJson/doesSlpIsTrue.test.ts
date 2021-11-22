import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesSlpIsTrueInPackageJson } from "../../../src";

describe("Test Task doesSlpIsTrueInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no slp set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesSlpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`slp must be true in ${dir}/package.json`)
    );
  });

  test("for slp = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ slp: true }) });
    await expect(doesSlpIsTrueInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for slp = false", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ slp: false }) });
    await expect(doesSlpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`slp must be true in ${dir}/package.json`)
    );
  });

  test('for slp = "true"', async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ slp: "true" }) });
    await expect(doesSlpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`slp must be true in ${dir}/package.json`)
    );
  });
});
