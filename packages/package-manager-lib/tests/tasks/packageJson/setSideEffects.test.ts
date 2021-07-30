import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setSideEffectsInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setSideEffectsInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior sideEffects set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setSideEffectsInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ sideEffects: false });
  });

  test("for sideEffects = false", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: false })
    });
    await expect(setSideEffectsInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ sideEffects: false });
  });

  test("for sideEffects = true", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: true })
    });
    await expect(setSideEffectsInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ sideEffects: false });
  });

  test('for sideEffects = "false"', async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ sideEffects: "false" })
    });
    await expect(setSideEffectsInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ sideEffects: false });
  });
});
