import { realpath, writeFile } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { execPromise, execute } from "../utils";
import chalk from "chalk";

describe("Test the somod command build", () => {
  let dir: string;
  let somodVersion: string;

  beforeAll(async () => {
    dir = createTempDir("test-somod-somod");
    createFiles(dir, {
      ".npmrc": "registry=http://localhost:8000",
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
    await execPromise("npm i somod", dir);
    somodVersion = (
      await readJsonFileStore(join(dir, "node_modules/somod/package.json"))
    ).version as string;
  }, 60000);

  afterAll(() => {
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
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0"
      })
    );

    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toEqual({
      failed: true,
      stderr: chalk.red(
        `Initialize Context :- Failed\n${await realpath(
          dir
        )} is not a SOMOD module`
      ),
      stdout: undefined
    });
  });

  test("with no required properties in package.json", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion
      })
    );

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
        "stderr": "[31mValidate package.json :- Failed[39m
      [31mpackage.json has following errors[39m
      [31m must have required property 'description'[39m
      [31m must have required property 'module'[39m
      [31m must have required property 'typings'[39m
      [31m must have required property 'files'[39m
      [31m must have required property 'sideEffects'[39m",
        "stdout": undefined,
      }
    `);
  });

  test("with invalid properties in package.json", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.ts",
        typings: "./build/lib/index.d.ts",
        files: ["builds"],
        sideEffects: true
      })
    );
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
        "stderr": "[31mValidate package.json :- Failed[39m
      [31mpackage.json has following errors[39m
      [31m module must be build/lib/index.js[39m
      [31m typings must be build/lib/index.d.ts[39m
      [31m files.0 must be equal to constant[39m
      [31m files must contain build[39m
      [31m sideEffects must be false[39m",
        "stdout": undefined,
      }
    `);
  });

  test("with main and jsnext:main in package.json", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
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
    );
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
        "stderr": "[31mValidate package.json :- Failed[39m
      [31mpackage.json has following errors[39m
      [31m main must not exist[39m
      [31m jsnext:main must not exist[39m",
        "stdout": undefined,
      }
    `);
  });

  test("with empty module", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false
      })
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "[33mSkipping TypeScript Compilation : tsconfig.somod.json not Found.[39m",
        "stdout": undefined,
      }
    `);
  });

  test("with empty module with verbose", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false
      })
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "[33mSkipping TypeScript Compilation : tsconfig.somod.json not Found.[39m",
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      [32mValidate tsconfig.somod.json :- Completed[39m
      [32mValidate parameters.yaml with schema :- Completed[39m
      [32mValidate package.json :- Completed[39m
      Validate ui/config.yaml with schema :- Started
      Validate ui/config.yaml :- Started
      Validate exports in ui/pages :- Started
      Validate exports in ui/pages-data :- Started
      [32mValidate ui/config.yaml with schema :- Completed[39m
      [32mValidate ui/config.yaml :- Completed[39m
      [32mValidate exports in ui/pages :- Completed[39m
      [32mValidate exports in ui/pages-data :- Completed[39m
      Validate serverless/template.yaml with schema :- Started
      [32mValidate serverless/template.yaml with schema :- Completed[39m
      Validate serverless/template.yaml :- Started
      [32mValidate serverless/template.yaml :- Completed[39m
      Validate exports in serverless/functions :- Started
      [32mValidate exports in serverless/functions :- Completed[39m
      Delete build directory :- Started
      [32mDelete build directory :- Completed[39m
      Compile Typescript :- Started
      [32mCompile Typescript :- Completed[39m
      Bundle Extensions :- Started
      [32mBundle Extensions :- Completed[39m
      Build ui/public :- Started
      [32mBuild ui/public :- Completed[39m
      Build ui/config.yaml :- Started
      [32mBuild ui/config.yaml :- Completed[39m
      Build serverless/template.yaml :- Started
      [32mBuild serverless/template.yaml :- Completed[39m
      Build parameters.yaml :- Started
      [32mBuild parameters.yaml :- Completed[39m
      Set somod version in package.json :- Started
      [32mSet somod version in package.json :- Completed[39m
      Save package.json :- Started
      [32mSave package.json :- Completed[39m",
      }
    `);
  });

  test("with empty module with verbose and ui only", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false
      })
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "-v", "--ui"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "[33mSkipping TypeScript Compilation : tsconfig.somod.json not Found.[39m",
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      [32mValidate tsconfig.somod.json :- Completed[39m
      [32mValidate parameters.yaml with schema :- Completed[39m
      [32mValidate package.json :- Completed[39m
      Validate ui/config.yaml with schema :- Started
      Validate ui/config.yaml :- Started
      Validate exports in ui/pages :- Started
      Validate exports in ui/pages-data :- Started
      [32mValidate ui/config.yaml with schema :- Completed[39m
      [32mValidate ui/config.yaml :- Completed[39m
      [32mValidate exports in ui/pages :- Completed[39m
      [32mValidate exports in ui/pages-data :- Completed[39m
      Delete build directory :- Started
      [32mDelete build directory :- Completed[39m
      Compile Typescript :- Started
      [32mCompile Typescript :- Completed[39m
      Bundle Extensions :- Started
      [32mBundle Extensions :- Completed[39m
      Build ui/public :- Started
      [32mBuild ui/public :- Completed[39m
      Build ui/config.yaml :- Started
      [32mBuild ui/config.yaml :- Completed[39m
      Build parameters.yaml :- Started
      [32mBuild parameters.yaml :- Completed[39m
      Set somod version in package.json :- Started
      [32mSet somod version in package.json :- Completed[39m
      Save package.json :- Started
      [32mSave package.json :- Completed[39m",
      }
    `);
  });

  test("with empty module with verbose and serverless only", async () => {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({
        name: "test-somod-module",
        version: "1.0.0",
        somod: somodVersion,
        description: "Test somod module",
        module: "build/lib/index.js",
        typings: "build/lib/index.d.ts",
        files: ["build"],
        sideEffects: false
      })
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "-v", "--serverless"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "[33mSkipping TypeScript Compilation : tsconfig.somod.json not Found.[39m",
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      [32mValidate tsconfig.somod.json :- Completed[39m
      [32mValidate parameters.yaml with schema :- Completed[39m
      [32mValidate package.json :- Completed[39m
      Validate serverless/template.yaml with schema :- Started
      [32mValidate serverless/template.yaml with schema :- Completed[39m
      Validate serverless/template.yaml :- Started
      [32mValidate serverless/template.yaml :- Completed[39m
      Validate exports in serverless/functions :- Started
      [32mValidate exports in serverless/functions :- Completed[39m
      Delete build directory :- Started
      [32mDelete build directory :- Completed[39m
      Compile Typescript :- Started
      [32mCompile Typescript :- Completed[39m
      Bundle Extensions :- Started
      [32mBundle Extensions :- Completed[39m
      Build serverless/template.yaml :- Started
      [32mBuild serverless/template.yaml :- Completed[39m
      Build parameters.yaml :- Started
      [32mBuild parameters.yaml :- Completed[39m
      Set somod version in package.json :- Started
      [32mSet somod version in package.json :- Completed[39m
      Save package.json :- Started
      [32mSave package.json :- Completed[39m",
      }
    `);
  });
});
