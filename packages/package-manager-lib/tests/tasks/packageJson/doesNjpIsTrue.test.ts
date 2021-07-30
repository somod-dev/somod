import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesNjpIsTrueInPackageJson } from "../../../src";

describe("Test Task doesNjpIsTrueInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no njp set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`njp must be true in ${dir}/package.json`)
    );
  });

  test("for njp = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ njp: true }) });
    await expect(doesNjpIsTrueInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for njp = false", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ njp: false }) });
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`njp must be true in ${dir}/package.json`)
    );
  });

  test('for njp = "true"', async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ njp: false }) });
    await expect(doesNjpIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`njp must be true in ${dir}/package.json`)
    );
  });
});
