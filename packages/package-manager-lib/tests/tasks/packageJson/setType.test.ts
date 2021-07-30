import { createFiles, createTempDir, deleteDir } from "../../utils";
import { setTypeInPackageJson } from "../../../src";
import { read } from "../../../src/utils/packageJson";

describe("Test Task setTypeInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior type set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(setTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ type: "module" });
  });

  test("for type = 'module'", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ type: "module" }) });
    await expect(setTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ type: "module" });
  });

  test("for type = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ type: true }) });
    await expect(setTypeInPackageJson(dir)).resolves.toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ type: "module" });
  });
});
