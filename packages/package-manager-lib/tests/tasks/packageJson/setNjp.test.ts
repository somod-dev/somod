import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setNjpInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setNjpInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior njp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ njp: true });
  });

  test("for njp = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: true }) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ njp: true });
  });

  test("for njp = false", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: false }) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ njp: true });
  });

  test('for njp = "true"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: "true" }) });
    await expect(setNjpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ njp: true });
  });
});
