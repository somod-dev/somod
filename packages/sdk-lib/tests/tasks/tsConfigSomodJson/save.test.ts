import { createFiles, createTempDir, deleteDir } from "../../utils";
import { saveTsConfigSomodJson } from "../../../src";
import { existsSync } from "fs";
import { join } from "path";
import { readJsonFileStore, updateJsonFileStore } from "@solib/cli-base";
import { readFile } from "fs/promises";

describe("Test Task saveTsConfigSomodJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no tsIgnoreSomodJson", async () => {
    await expect(saveTsConfigSomodJson(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "tsconfig.somod.json"))).toBeFalsy();
  });

  test("for tsIgnoreSomodJson with out update", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({ include: ["ui"] })
    });
    await expect(saveTsConfigSomodJson(dir)).resolves.toBeUndefined();
  });

  test("for tsIgnoreSomodJson with update", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({ include: ["ui"] })
    });
    const tsIgnoreSomodJsonPath = join(dir, "tsconfig.somod.json");
    const tsIgnoreSomodJsonContent = await readJsonFileStore(
      tsIgnoreSomodJsonPath
    );
    tsIgnoreSomodJsonContent.compilerOptions = { allowJs: true };
    updateJsonFileStore(tsIgnoreSomodJsonPath, tsIgnoreSomodJsonContent);
    await expect(saveTsConfigSomodJson(dir)).resolves.toBeUndefined();
    await expect(
      readFile(tsIgnoreSomodJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(
      `{
  "include": [
    "ui"
  ],
  "compilerOptions": {
    "allowJs": true
  }
}
`
    );
  });
});
