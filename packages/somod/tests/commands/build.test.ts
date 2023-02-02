import { mkdir, realpath, symlink } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { execute } from "../utils";

describe("Test the somod command build", () => {
  let dir: string;
  let somodVersion: string;

  beforeAll(async () => {
    somodVersion = (
      await readJsonFileStore(join(__dirname, "../../package.json"))
    ).version as string;
  });

  beforeEach(async () => {
    dir = createTempDir("test-somod-somod");
    await mkdir(join(dir, "node_modules/.bin"), { recursive: true });
    await symlink(
      join(__dirname, "../../"),
      join(dir, "node_modules", "somod")
    );
    await symlink(
      join(dir, "node_modules", "somod", "bin", "somod.js"),
      join(dir, "node_modules", ".bin", "somod")
    );
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("help", async () => {
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "-h"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
        "stdout": "Usage: somod build [options]

      Options:
        --ui           only ui
        --serverless   only serverless
        -v, --verbose  enable verbose
        -h, --help     display help for command",
      }
    `);
  });

  test("with non somod module", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0"
      })
    });
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toEqual({
      failed: true,
      stderr: `Initialize Context :- Failed\n${await realpath(
        dir
      )} is not a SOMOD module`,
      stdout: undefined
    });
  });

  test("with no required properties in package.json", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion
      })
    });
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failed": true,
        "stderr": "Validate package.json :- Failed
      package.json has following errors
       must have required property 'description'
       must have required property 'module'
       must have required property 'typings'
       must have required property 'files'
       must have required property 'sideEffects'",
        "stdout": undefined,
      }
    `);
  });

  test("with invalid properties in package.json", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.ts",
        typings: "./build/lib/index.d.ts",
        files: ["builds"],
        sideEffects: true
      })
    });
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failed": true,
        "stderr": "Validate package.json :- Failed
      package.json has following errors
       module must be build/lib/index.js
       typings must be build/lib/index.d.ts
       files.0 must be equal to constant
       files must contain build
       sideEffects must be false",
        "stdout": undefined,
      }
    `);
  });

  test("with main and jsnext:main in package.json", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false,
        main: "index.js",
        "jsnext:main": "index.js"
      })
    });
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failed": true,
        "stderr": "Validate package.json :- Failed
      package.json has following errors
       main must not exist
       jsnext:main must not exist",
        "stdout": undefined,
      }
    `);
  });

  test("with empty module", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false
      })
    });
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "Skipping TypeScript Compilation : tsconfig.somod.json not Found.",
        "stdout": undefined,
      }
    `);
  });
});
