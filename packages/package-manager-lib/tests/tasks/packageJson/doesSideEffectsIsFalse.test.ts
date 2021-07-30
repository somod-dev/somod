import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesSideEffectsIsFalseInPackageJson } from "../../../src";

describe("Test Task doesSideEffectsIsFalseInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no sideEffects set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesSideEffectsIsFalseInPackageJson(dir)).rejects.toEqual(
      new Error(`sideEffects must be false in ${dir}/package.json`)
    );
  });

  test("for sideEffects = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ sideEffects: true }) });
    await expect(doesSideEffectsIsFalseInPackageJson(dir)).rejects.toEqual(
      new Error(`sideEffects must be false in ${dir}/package.json`)
    );
  });

  test("for sideEffects = false", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: false })
    });
    await expect(
      doesSideEffectsIsFalseInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test('for sideEffects = "false"', async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: "false" })
    });
    await expect(doesSideEffectsIsFalseInPackageJson(dir)).rejects.toEqual(
      new Error(`sideEffects must be false in ${dir}/package.json`)
    );
  });

  test("for sideEffects = null", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: null })
    });
    await expect(doesSideEffectsIsFalseInPackageJson(dir)).rejects.toEqual(
      new Error(`sideEffects must be false in ${dir}/package.json`)
    );
  });
});
