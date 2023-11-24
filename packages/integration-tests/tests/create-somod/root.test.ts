/**
 * @jest-environment steps
 */

import { existsSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { createTempDir, deleteDir, readFiles } from "nodejs-file-utils";
import { join } from "path";
import { execute } from "../utils";

describe("Test the create-somod", () => {
  let dir: string;
  let somodDir: string;

  beforeAll(async () => {
    dir = createTempDir("test-somod-create");
    process.env.npm_config_registry = "http://localhost:8000";
    process.env.npm_config_cache = join(dir, ".npm");
  });

  afterEach(async () => {
    if (somodDir && existsSync(somodDir)) {
      deleteDir(somodDir);
    }
  });

  afterAll(() => {
    deleteDir(dir);
  });

  const assertCreatedProject = (projectDir: string) => {
    // package-lock.json
    const somodVersion = JSON.parse(
      readFileSync(join(projectDir, "package-lock.json"), "utf8")
    ).packages["node_modules/somod"].version;
    unlinkSync(join(projectDir, "package-lock.json"));

    // package.json
    const packageJson = JSON.parse(
      readFileSync(join(projectDir, "package.json"), "utf8")
    );
    Object.keys(packageJson.devDependencies).forEach(dep => {
      packageJson.devDependencies[dep] = "REPLACED_TEXT_FOR_ASSERT";
    });
    expect(packageJson.somod).toEqual(somodVersion);
    packageJson.somod = "REPLACED_TEXT_FOR_ASSERT";
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // node_modules and .git
    deleteDir(join(projectDir, "node_modules"));
    deleteDir(join(projectDir, ".git"));

    // favicon.ico
    const files = readFiles(projectDir);
    if (files["ui/public/favicon.ico"]) {
      files["ui/public/favicon.ico"] = "REPLACED_TEXT_FOR_ASSERT";
    }
    expect(files).toMatchSnapshot();
  };

  test("help", async () => {
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      ["create-somod", "-h"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result.stdout).toMatchSnapshot();
  });

  test("without options", async () => {
    somodDir = join(dir, "my-module");
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      ["create-somod"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    assertCreatedProject(somodDir);
  }, 300000);

  test("with module name", async () => {
    somodDir = join(dir, "new-somod-module");
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      ["create-somod", "new-somod-module"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    assertCreatedProject(somodDir);
  }, 300000);

  test("with out git eslint and prettier", async () => {
    somodDir = join(dir, "new-module");
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      [
        "create-somod",
        "--no-git",
        "--no-eslint",
        "--no-prettier",
        "new-module"
      ],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    assertCreatedProject(somodDir);
  }, 300000);

  test("with only serverless", async () => {
    somodDir = join(dir, "serverless-module");
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      ["create-somod", "--serverless", "serverless-module"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    assertCreatedProject(somodDir);
  }, 300000);

  test("with only ui", async () => {
    somodDir = join(dir, "ui-module");
    const result = await execute(
      dir,
      process.platform == "win32" ? "npx.cmd" : "npx",
      ["create-somod", "--ui", "ui-module"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result["failed"]).toBeUndefined();
    assertCreatedProject(somodDir);
  }, 300000);
});
