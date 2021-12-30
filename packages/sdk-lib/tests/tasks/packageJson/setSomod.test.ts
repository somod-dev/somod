import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setSomodInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setSomodInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior somod set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ somod: true });
  });

  test("for somod = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: true }) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ somod: true });
  });

  test("for somod = false", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: false }) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ somod: true });
  });

  test('for somod = "true"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: "true" }) });
    await expect(setSomodInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ somod: true });
  });
});
