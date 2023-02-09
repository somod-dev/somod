import { realpath, writeFile } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { execPromise, execute } from "../utils";

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
        "stderr": "",
        "stdout": "Usage: somod prepare [options]

      Options:
        --ui           only ui
        --serverless   only serverless
        -v, --verbose  enable verbose
        -h, --help     display help for command
      ",
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
      stderr: `Initialize Context :- Failed\n${await realpath(
        dir
      )} is not a SOMOD module\n`,
      stdout: ""
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
        "stderr": "",
        "stdout": "",
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
        "stderr": "",
        "stdout": "",
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
        "stderr": "",
        "stdout": "",
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
        "stderr": "",
        "stdout": "",
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
        "stderr": "",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Create/Update /parameters.json :- Started
      Create/Update /parameters.json :- Completed
      Deleting /pages and /public :- Started
      Deleting /pages and /public :- Completed
      Create /pages :- Started
      Create /pages :- Completed
      Create /public :- Started
      Create /public :- Completed
      Gernerate /next.config.js and /.env :- Started
      Gernerate /next.config.js and /.env :- Completed
      Bundle Serverless Functions :- Started
      Bundle Serverless Functions :- Completed
      Bundle Serverless FunctionLayers :- Started
      Bundle Serverless FunctionLayers :- Completed
      Generate /template.yaml :- Started
      Generate /template.yaml :- Completed
      ",
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
        "stderr": "",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Create/Update /parameters.json :- Started
      Create/Update /parameters.json :- Completed
      Deleting /pages and /public :- Started
      Deleting /pages and /public :- Completed
      Create /pages :- Started
      Create /pages :- Completed
      Create /public :- Started
      Create /public :- Completed
      Gernerate /next.config.js and /.env :- Started
      Gernerate /next.config.js and /.env :- Completed
      ",
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
        "stderr": "",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Create/Update /parameters.json :- Started
      Create/Update /parameters.json :- Completed
      Bundle Serverless Functions :- Started
      Bundle Serverless Functions :- Completed
      Bundle Serverless FunctionLayers :- Started
      Bundle Serverless FunctionLayers :- Completed
      Generate /template.yaml :- Started
      Generate /template.yaml :- Completed
      ",
      }
    `);
  });
});
