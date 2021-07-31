import { createFiles, createTempDir, deleteDir } from "../../utils";
import { saveTsConfigBuildJson } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { read, update } from "../../../src/utils/jsonFileStore";
import { readFile } from "fs/promises";

describe("Test Task saveTsConfigBuildJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no tsIgnoreBuildJson", async () => {
    await expect(saveTsConfigBuildJson(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "tsconfig.build.json"))).toBeFalsy();
  });

  test("for tsIgnoreBuildJson with out update", async () => {
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify({ include: ["ui"] })
    });
    await expect(saveTsConfigBuildJson(dir)).resolves.toBeUndefined();
  });

  test("for tsIgnoreBuildJson with update", async () => {
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify({ include: ["ui"] })
    });
    const tsIgnoreBuildJsonPath = join(dir, "tsconfig.build.json");
    const tsIgnoreBuildJsonContent = await read(tsIgnoreBuildJsonPath);
    tsIgnoreBuildJsonContent.compilerOptions = { allowJs: true };
    update(tsIgnoreBuildJsonPath, tsIgnoreBuildJsonContent);
    await expect(saveTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(
      readFile(tsIgnoreBuildJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(
      `{
  "include": [
    "ui"
  ],
  "compilerOptions": {
    "allowJs": true
  }
}`
    );
  });
});
