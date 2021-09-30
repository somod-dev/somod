import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setEmpInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setEmpInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior emp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setEmpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ emp: true });
  });

  test("for emp = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ emp: true }) });
    await expect(setEmpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ emp: true });
  });

  test("for emp = false", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ emp: false }) });
    await expect(setEmpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ emp: true });
  });

  test('for emp = "true"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ emp: "true" }) });
    await expect(setEmpInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ emp: true });
  });
});
