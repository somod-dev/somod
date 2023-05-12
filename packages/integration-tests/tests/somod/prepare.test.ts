/**
 * @jest-environment steps
 */

import { existsSync } from "fs";
import { readFile, realpath, unlink, writeFile } from "fs/promises";
import {
  createFiles,
  createTempDir,
  deleteDir,
  readFiles,
  readJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { cleanUp, copySource, execPromise, execute } from "../utils";

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
  }, 180000);

  afterAll(() => {
    deleteDir(dir);
  });

  describe("test basic command options with empty module", () => {
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
          -d, --debug    Enable Debug mode
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

  describe("test the somod prepare command on sample serverless-module", () => {
    let somodWorkingDir: string;
    let parametersJson: string;
    let templateYaml: string;

    const sampleModulePath = join(
      __dirname,
      "../../samples/push-notification-service"
    );

    beforeAll(async () => {
      await copySource(sampleModulePath, dir, [
        "serverless",
        ".npmrc",
        "package.json",
        "parameters.yaml",
        "tsconfig.somod.json"
      ]);
      await execPromise("npm i", dir); // install module dependencies
      somodWorkingDir = join(dir, ".somod");
      parametersJson = join(dir, "parameters.json");
      templateYaml = join(dir, "template.yaml");
    }, 180000);

    afterAll(async () => {
      await cleanUp(dir, [".npmrc", "node_modules"]);
    });

    afterEach(async () => {
      if (existsSync(somodWorkingDir)) {
        deleteDir(somodWorkingDir);
      }
      if (existsSync(parametersJson)) {
        await unlink(parametersJson);
      }
      if (existsSync(templateYaml)) {
        await unlink(templateYaml);
      }
    });

    test("prepare without running build", async () => {
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare", "--serverless"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result["failed"]).toEqual(true);
      expect(
        result.stderr.includes("✘ [ERROR] Could not resolve")
      ).toBeTruthy();
      expect(
        result.stderr.includes("Bundle Serverless Functions :- Failed")
      ).toBeTruthy();
      expect(result.stdout).toEqual("");
    });

    test("run build", async () => {
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
    });

    test("prepare without verbose", async () => {
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare", "--serverless"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "stderr": "",
          "stdout": "",
        }
      `);
      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "template.yaml"), "utf8")
      );
    });

    test("prepare with verbose and no --serverless", async () => {
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

      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "template.yaml"), "utf8")
      );
    });

    test("prepare with prior parameters", async () => {
      createFiles(dir, {
        "parameters.json": JSON.stringify({
          "pns.publish.endpoint": "https://example.com/publish",
          "pns.subscribe.endpoint": "wss://example.com/subscribe",
          "auth.token.endpoint": "https://example.com/auth/token",
          "auth.authorization.endpoint": "https://example.com/authorization"
        })
      });
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare", "--serverless"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "stderr": "",
          "stdout": "",
        }
      `);

      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves
        .toMatchInlineSnapshot(`
        "{
          \\"pns.publish.endpoint\\": \\"https://example.com/publish\\",
          \\"pns.subscribe.endpoint\\": \\"wss://example.com/subscribe\\",
          \\"auth.token.endpoint\\": \\"https://example.com/auth/token\\",
          \\"auth.authorization.endpoint\\": \\"https://example.com/authorization\\"
        }
        "
      `);
      let expectedTemplate = await readFile(
        join(sampleModulePath, "template.yaml"),
        "utf8"
      );
      expectedTemplate = expectedTemplate.replace(
        "AUTH_END_POINT: ''",
        "AUTH_END_POINT: https://example.com/auth/token"
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        expectedTemplate
      );
    });
  });

  describe("test the somod prepare command on sample ui-module", () => {
    let pagesDir: string;
    let parametersJson: string;
    let envFile: string;

    const sampleModulePath = join(
      __dirname,
      "../../samples/push-notification-ui"
    );

    beforeAll(async () => {
      await copySource(sampleModulePath, dir, [
        "lib",
        "ui",
        ".npmrc",
        "package.json",
        "parameters.yaml",
        "tsconfig.somod.json"
      ]);
      await execPromise("npm i", dir); // install module dependencies

      pagesDir = join(dir, "pages");
      parametersJson = join(dir, "parameters.json");
      envFile = join(dir, ".env");
    }, 180000);

    afterAll(async () => {
      await cleanUp(dir, [".npmrc", "node_modules"]);
    });

    afterEach(async () => {
      if (existsSync(pagesDir)) {
        deleteDir(pagesDir);
      }
      if (existsSync(parametersJson)) {
        await unlink(parametersJson);
      }
      if (existsSync(envFile)) {
        await unlink(envFile);
      }
    });

    test("prepare without verbose", async () => {
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare", "--ui"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "stderr": "",
          "stdout": "",
        }
      `);
      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, ".env"), "utf8")
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
    });

    test("prepare with verbose and no --ui", async () => {
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

      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, ".env"), "utf8")
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
    });

    test("build with prior parameters", async () => {
      createFiles(dir, {
        "parameters.json": JSON.stringify({
          "pns.publish.endpoint": "https://example.com/publish",
          "pns.subscribe.endpoint": "wss://example.com/subscribe",
          "auth.token.endpoint": "https://example.com/auth/token",
          "auth.authorization.endpoint": "https://example.com/authorization"
        })
      });
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare", "--ui"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "stderr": "",
          "stdout": "",
        }
      `);

      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toMatchInlineSnapshot(`
        "NEXT_PUBLIC_PNS_PUBLISH_ENDPOINT=\\"https://example.com/publish\\"
        NEXT_PUBLIC_PNS_SUBSCRIBE_ENDPOINT=\\"wss://example.com/subscribe\\""
      `);
      await expect(readFile(parametersJson, "utf8")).resolves
        .toMatchInlineSnapshot(`
        "{
          \\"pns.publish.endpoint\\": \\"https://example.com/publish\\",
          \\"pns.subscribe.endpoint\\": \\"wss://example.com/subscribe\\",
          \\"auth.token.endpoint\\": \\"https://example.com/auth/token\\",
          \\"auth.authorization.endpoint\\": \\"https://example.com/authorization\\"
        }
        "
      `);
    });
  });

  describe("test the somod prepare command on sample serverless and ui module", () => {
    let somodWorkingDir: string;
    let parametersJson: string;
    let templateYaml: string;
    let pagesDir: string;
    let envFile: string;

    const sampleModulePath = join(__dirname, "../../samples/push-notification");

    beforeAll(async () => {
      await copySource(sampleModulePath, dir, [
        "serverless",
        "ui",
        ".npmrc",
        "package.json",
        "parameters.yaml",
        "tsconfig.somod.json"
      ]);
      await execPromise("npm i", dir); // install module dependencies
      somodWorkingDir = join(dir, ".somod");
      parametersJson = join(dir, "parameters.json");
      templateYaml = join(dir, "template.yaml");
      pagesDir = join(dir, "pages");
      envFile = join(dir, ".env");
    }, 180000);

    afterAll(async () => {
      await cleanUp(dir, [".npmrc", "node_modules"]);
    });

    afterEach(async () => {
      if (existsSync(somodWorkingDir)) {
        deleteDir(somodWorkingDir);
      }
      if (existsSync(parametersJson)) {
        await unlink(parametersJson);
      }
      if (existsSync(templateYaml)) {
        await unlink(templateYaml);
      }
      if (existsSync(pagesDir)) {
        deleteDir(pagesDir);
      }
      if (existsSync(envFile)) {
        await unlink(envFile);
      }
    });

    test("prepare without running build", async () => {
      const result = await execute(
        dir,
        "npx",
        ["somod", "prepare"],
        { return: "on", show: "off" },
        { return: "on", show: "off" }
      );
      expect(result["failed"]).toEqual(true);
      expect(
        result.stderr.includes("✘ [ERROR] Could not resolve")
      ).toBeTruthy();
      expect(
        result.stderr.includes("Bundle Serverless Functions :- Failed")
      ).toBeTruthy();
      expect(result.stdout).toEqual("");
    });

    test("run build", async () => {
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

    test("prepare without verbose", async () => {
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
      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "template.yaml"), "utf8")
      );
      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, ".env"), "utf8")
      );
    });

    test("prepare only --serverless", async () => {
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

      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "template.yaml"), "utf8")
      );
      expect(existsSync(pagesDir)).not.toBeTruthy();
      expect(existsSync(envFile)).not.toBeTruthy();
    });

    test("prepare only --ui", async () => {
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

      expect(existsSync(somodWorkingDir)).not.toBeTruthy();
      await expect(readFile(parametersJson, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, "parameters.json"), "utf8")
      );
      expect(existsSync(templateYaml)).not.toBeTruthy();
      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toEqual(
        await readFile(join(sampleModulePath, ".env"), "utf8")
      );
    });

    test("prepare with prior parameters", async () => {
      createFiles(dir, {
        "parameters.json": JSON.stringify({
          "pns.publish.endpoint": "https://example.com/publish",
          "pns.subscribe.endpoint": "wss://example.com/subscribe",
          "auth.token.endpoint": "https://example.com/auth/token",
          "auth.authorization.endpoint": "https://example.com/authorization"
        })
      });
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

      expect(readFiles(somodWorkingDir)).toEqual(
        readFiles(join(sampleModulePath, ".somod"))
      );
      await expect(readFile(parametersJson, "utf8")).resolves
        .toMatchInlineSnapshot(`
        "{
          \\"pns.publish.endpoint\\": \\"https://example.com/publish\\",
          \\"pns.subscribe.endpoint\\": \\"wss://example.com/subscribe\\",
          \\"auth.token.endpoint\\": \\"https://example.com/auth/token\\",
          \\"auth.authorization.endpoint\\": \\"https://example.com/authorization\\"
        }
        "
      `);
      let expectedTemplate = await readFile(
        join(sampleModulePath, "template.yaml"),
        "utf8"
      );
      expectedTemplate = expectedTemplate.replace(
        "AUTH_END_POINT: ''",
        "AUTH_END_POINT: https://example.com/auth/token"
      );
      await expect(readFile(templateYaml, "utf8")).resolves.toEqual(
        expectedTemplate
      );
      expect(readFiles(pagesDir)).toEqual(
        readFiles(join(sampleModulePath, "pages"))
      );
      await expect(readFile(envFile, "utf8")).resolves.toMatchInlineSnapshot(`
        "NEXT_PUBLIC_PNS_PUBLISH_ENDPOINT=\\"https://example.com/publish\\"
        NEXT_PUBLIC_PNS_SUBSCRIBE_ENDPOINT=\\"wss://example.com/subscribe\\""
      `);
    });
  });
});
