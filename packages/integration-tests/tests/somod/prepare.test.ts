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

describe("Test the somod command prepare", () => {
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
      ["somod", "prepare", "-h"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
        "stdout": "Usage: somod prepare [options]

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
      ["somod", "prepare"],
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
      ["somod", "prepare"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
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
      ["somod", "prepare"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
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
      ["somod", "prepare"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
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
      ["somod", "prepare"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
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
      ["somod", "prepare", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Create/Update /parameters.json :- Started
      [32mCreate/Update /parameters.json :- Completed[39m
      Deleting /pages and /public :- Started
      [32mDeleting /pages and /public :- Completed[39m
      Create /pages :- Started
      [32mCreate /pages :- Completed[39m
      Create /public :- Started
      [32mCreate /public :- Completed[39m
      Gernerate /next.config.js and /.env :- Started
      [32mGernerate /next.config.js and /.env :- Completed[39m
      Bundle Serverless Functions :- Started
      [32mBundle Serverless Functions :- Completed[39m
      Bundle Serverless FunctionLayers :- Started
      [32mBundle Serverless FunctionLayers :- Completed[39m
      Generate /template.yaml :- Started
      [32mGenerate /template.yaml :- Completed[39m",
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
      ["somod", "prepare", "-v", "--ui"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Create/Update /parameters.json :- Started
      [32mCreate/Update /parameters.json :- Completed[39m
      Deleting /pages and /public :- Started
      [32mDeleting /pages and /public :- Completed[39m
      Create /pages :- Started
      [32mCreate /pages :- Completed[39m
      Create /public :- Started
      [32mCreate /public :- Completed[39m
      Gernerate /next.config.js and /.env :- Started
      [32mGernerate /next.config.js and /.env :- Completed[39m",
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
      ["somod", "prepare", "-v", "--serverless"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": undefined,
        "stdout": "Initialize Context :- Started
      [32mInitialize Context :- Completed[39m
      Create/Update /parameters.json :- Started
      [32mCreate/Update /parameters.json :- Completed[39m
      Bundle Serverless Functions :- Started
      [32mBundle Serverless Functions :- Completed[39m
      Bundle Serverless FunctionLayers :- Started
      [32mBundle Serverless FunctionLayers :- Completed[39m
      Generate /template.yaml :- Started
      [32mGenerate /template.yaml :- Completed[39m",
      }
    `);
  });
});
