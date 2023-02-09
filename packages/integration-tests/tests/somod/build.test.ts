import { existsSync } from "fs";
import { realpath, rename, writeFile } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles,
  readJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { copySource, execPromise, execute } from "../utils";

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
        "stderr": "",
        "stdout": "Usage: somod build [options]

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
      ["somod", "build"],
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
       must have required property 'sideEffects'
      ",
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
       sideEffects must be false
      ",
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
       jsnext:main must not exist
      ",
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
      ["somod", "build"],
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
      ["somod", "build", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "Skipping TypeScript Compilation : tsconfig.somod.json not Found.
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate tsconfig.somod.json :- Completed
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate ui/config.yaml with schema :- Started
      Validate ui/config.yaml :- Started
      Validate exports in ui/pages :- Started
      Validate exports in ui/pages-data :- Started
      Validate ui/config.yaml with schema :- Completed
      Validate ui/config.yaml :- Completed
      Validate exports in ui/pages :- Completed
      Validate exports in ui/pages-data :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      Validate serverless/template.yaml :- Completed
      Validate exports in serverless/functions :- Started
      Validate exports in serverless/functions :- Completed
      Delete build directory :- Started
      Delete build directory :- Completed
      Compile Typescript :- Started
      Compile Typescript :- Completed
      Bundle Extensions :- Started
      Bundle Extensions :- Completed
      Build ui/public :- Started
      Build ui/public :- Completed
      Build ui/config.yaml :- Started
      Build ui/config.yaml :- Completed
      Build serverless/template.yaml :- Started
      Build serverless/template.yaml :- Completed
      Build parameters.yaml :- Started
      Build parameters.yaml :- Completed
      Set somod version in package.json :- Started
      Set somod version in package.json :- Completed
      Save package.json :- Started
      Save package.json :- Completed
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
      ["somod", "build", "-v", "--ui"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "Skipping TypeScript Compilation : tsconfig.somod.json not Found.
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate tsconfig.somod.json :- Completed
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate ui/config.yaml with schema :- Started
      Validate ui/config.yaml :- Started
      Validate exports in ui/pages :- Started
      Validate exports in ui/pages-data :- Started
      Validate ui/config.yaml with schema :- Completed
      Validate ui/config.yaml :- Completed
      Validate exports in ui/pages :- Completed
      Validate exports in ui/pages-data :- Completed
      Delete build directory :- Started
      Delete build directory :- Completed
      Compile Typescript :- Started
      Compile Typescript :- Completed
      Bundle Extensions :- Started
      Bundle Extensions :- Completed
      Build ui/public :- Started
      Build ui/public :- Completed
      Build ui/config.yaml :- Started
      Build ui/config.yaml :- Completed
      Build parameters.yaml :- Started
      Build parameters.yaml :- Completed
      Set somod version in package.json :- Started
      Set somod version in package.json :- Completed
      Save package.json :- Started
      Save package.json :- Completed
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
      ["somod", "build", "-v", "--serverless"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "Skipping TypeScript Compilation : tsconfig.somod.json not Found.
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate tsconfig.somod.json :- Completed
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      Validate serverless/template.yaml :- Completed
      Validate exports in serverless/functions :- Started
      Validate exports in serverless/functions :- Completed
      Delete build directory :- Started
      Delete build directory :- Completed
      Compile Typescript :- Started
      Compile Typescript :- Completed
      Bundle Extensions :- Started
      Bundle Extensions :- Completed
      Build serverless/template.yaml :- Started
      Build serverless/template.yaml :- Completed
      Build parameters.yaml :- Started
      Build parameters.yaml :- Completed
      Set somod version in package.json :- Started
      Set somod version in package.json :- Completed
      Save package.json :- Started
      Save package.json :- Completed
      ",
      }
    `);
  });
});

describe("test the somod build command on sample serverless-module", () => {
  let dir: string;
  let buildDir: string;

  const sampleModulePath = join(
    __dirname,
    "../../samples/push-notification-service"
  );

  beforeAll(async () => {
    dir = createTempDir("test-somod-somod");
    createFiles(dir, {
      ".npmrc": "registry=http://localhost:8000"
    });
    await copySource(sampleModulePath, dir, [
      "build",
      "node_modules",
      ".aws-sam",
      ".somod"
    ]);
    await execPromise("npm i somod", dir);
    buildDir = join(dir, "build");
  }, 60000);

  test("build without verbose", async () => {
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "--serverless"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "",
        "stdout": "",
      }
    `);
    expect(readFiles(buildDir)).toEqual(
      readFiles(join(sampleModulePath, "build"))
    );
    deleteDir(buildDir);
  });

  test("build with verbose", async () => {
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "--serverless", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate tsconfig.somod.json :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      Validate serverless/template.yaml :- Completed
      Validate exports in serverless/functions :- Started
      Validate exports in serverless/functions :- Completed
      Delete build directory :- Started
      Delete build directory :- Completed
      Compile Typescript :- Started
      Compile Typescript :- Completed
      Bundle Extensions :- Started
      Bundle Extensions :- Completed
      Build serverless/template.yaml :- Started
      Build serverless/template.yaml :- Completed
      Build parameters.yaml :- Started
      Build parameters.yaml :- Completed
      Set somod version in package.json :- Started
      Set somod version in package.json :- Completed
      Save package.json :- Started
      Save package.json :- Completed
      ",
      }
    `);

    expect(readFiles(buildDir)).toEqual(
      readFiles(join(sampleModulePath, "build"))
    );
    deleteDir(buildDir);
  });

  test("build without tsconfig.somod.json", async () => {
    await rename(
      join(dir, "tsconfig.somod.json"),
      join(dir, "tsconfig.somod.json.bkup")
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "--serverless", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "Skipping TypeScript Compilation : tsconfig.somod.json not Found.
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate tsconfig.somod.json :- Completed
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      Validate serverless/template.yaml :- Completed
      Validate exports in serverless/functions :- Started
      Validate exports in serverless/functions :- Completed
      Delete build directory :- Started
      Delete build directory :- Completed
      Compile Typescript :- Started
      Compile Typescript :- Completed
      Bundle Extensions :- Started
      Bundle Extensions :- Completed
      Build serverless/template.yaml :- Started
      Build serverless/template.yaml :- Completed
      Build parameters.yaml :- Started
      Build parameters.yaml :- Completed
      Set somod version in package.json :- Started
      Set somod version in package.json :- Completed
      Save package.json :- Started
      Save package.json :- Completed
      ",
      }
    `);

    const expectedBuildFiles = readFiles(join(sampleModulePath, "build"));
    Object.keys(expectedBuildFiles).forEach(buildFilePath => {
      if (buildFilePath.startsWith("serverless/functions")) {
        delete expectedBuildFiles[buildFilePath];
      }
    });
    expect(readFiles(buildDir)).toEqual(expectedBuildFiles);
    deleteDir(buildDir);
    await rename(
      join(dir, "tsconfig.somod.json.bkup"),
      join(dir, "tsconfig.somod.json")
    );
  });

  test("build without a serverless function code", async () => {
    await rename(
      join(dir, "serverless/functions/ondisconnect.ts"),
      join(dir, "serverless/functions/ondisconnect.ts.bkup")
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "--serverless", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failed": true,
        "stderr": "Validate serverless/template.yaml :- Failed
      Error at Resources.OnDisconnectFunction.Properties.CodeUri : Function ondisconnect not found. Create the function under serverless/functions directory
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate tsconfig.somod.json :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      ",
      }
    `);

    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
    await rename(
      join(dir, "serverless/functions/ondisconnect.ts.bkup"),
      join(dir, "serverless/functions/ondisconnect.ts")
    );
  });

  test("build without a parameters", async () => {
    await rename(
      join(dir, "parameters.yaml"),
      join(dir, "parameters.yaml.bkup")
    );
    const result = await execute(
      dir,
      "npx",
      ["somod", "build", "--serverless", "-v"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "failed": true,
        "stderr": "Validate serverless/template.yaml :- Failed
      Error at Resources.OnConnectFunction.Properties.Environment.Variables.AUTH_END_POINT : parameter auth.token.endpoint referenced by SOMOD::Parameter does not exist. Define auth.token.endpoint in /parameters.yaml
      Error at  : parameter pns.publish.endpoint referenced by Outputs does not exist. Define pns.publish.endpoint in /parameters.yaml
      Error at  : parameter pns.subscribe.endpoint referenced by Outputs does not exist. Define pns.subscribe.endpoint in /parameters.yaml
      ",
        "stdout": "Initialize Context :- Started
      Initialize Context :- Completed
      Validate package.json :- Started
      Validate tsconfig.somod.json :- Started
      Validate parameters.yaml with schema :- Started
      Validate parameters.yaml with schema :- Completed
      Validate package.json :- Completed
      Validate tsconfig.somod.json :- Completed
      Validate serverless/template.yaml with schema :- Started
      Validate serverless/template.yaml with schema :- Completed
      Validate serverless/template.yaml :- Started
      ",
      }
    `);

    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
    await rename(
      join(dir, "parameters.yaml.bkup"),
      join(dir, "parameters.yaml")
    );
  });
});
