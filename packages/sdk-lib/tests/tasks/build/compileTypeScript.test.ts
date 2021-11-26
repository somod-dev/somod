import { childProcess } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { EOL } from "os";
import { join } from "path";
import { compileTypeScript } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

const validTsConfig = {
  compilerOptions: {
    allowUmdGlobalAccess: false,
    outDir: "build",
    declaration: true,
    target: "ES5",
    module: "ES6",
    rootDir: "./",
    lib: ["ESNext"],
    moduleResolution: "Node",
    esModuleInterop: true,
    importHelpers: true
  },
  include: ["lib", "ui", "serverless"]
};

describe("Test Task compileTypeScript", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
    childProcess(dir, process.platform === "win32" ? "npm.cmd" : "npm", [
      "install",
      "typescript",
      "--save-dev"
    ]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no tsconfig file", async () => {
    await expect(compileTypeScript(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "error TS5058: The specified path does not exist: 'tsconfig.build.json'"
      )
    });
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for tsconfig.json file", async () => {
    createFiles(dir, {
      "tsconfig.json": JSON.stringify({ compilerOptions: { target: "ES5" } })
    });
    await expect(compileTypeScript(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "error TS5058: The specified path does not exist: 'tsconfig.build.json'"
      )
    });
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for tsconfig.build.json without any files", async () => {
    createFiles(dir, { "tsconfig.build.json": JSON.stringify(validTsConfig) });
    await expect(compileTypeScript(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for tsconfig.build.json with files", async () => {
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(validTsConfig),
      "lib/a.ts": "export const a = 10;"
    });
    await expect(compileTypeScript(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/lib/a.js"), { encoding: "utf8" })
    ).resolves.toEqual("export var a = 10;" + EOL);
    await expect(
      readFile(join(dir, "build/lib/a.d.ts"), { encoding: "utf8" })
    ).resolves.toEqual("export declare const a = 10;" + EOL);
  });
});
