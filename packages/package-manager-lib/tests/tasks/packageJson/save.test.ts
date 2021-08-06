import { createFiles, createTempDir, deleteDir } from "../../utils";
import { savePackageJson, setNjpInPackageJson } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { read, update } from "../../../src/utils/jsonFileStore";
import { readFile } from "fs/promises";

describe("Test Task savePackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no packageJson", async () => {
    await expect(savePackageJson(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "package.json"))).toBeFalsy();
  });

  test("for packageJson with out update", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "some-package"
      })
    });
    await expect(savePackageJson(dir)).resolves.toBeUndefined();
  });

  test("for packageJson with update", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "some-package"
      })
    });
    const packageJsonPath = join(dir, "package.json");
    const packageJsonContent = await read(packageJsonPath);
    packageJsonContent.version = "1.0.0";
    update(packageJsonPath, packageJsonContent);
    await expect(savePackageJson(dir)).resolves.toBeUndefined();
    await expect(
      readFile(packageJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify({ name: "some-package", version: "1.0.0" }, null, 2)
    );
  });

  test("for setNjp and save", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "some-package"
      })
    });
    const packageJsonPath = join(dir, "package.json");
    await setNjpInPackageJson(dir);
    await expect(savePackageJson(dir)).resolves.toBeUndefined();
    await expect(
      readFile(packageJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify({ name: "some-package", njp: true }, null, 2)
    );
  });
});
