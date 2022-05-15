import { cloneDeep } from "lodash";
import { join } from "path";
import { isValidTsConfigBuildJson } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { ErrorSet } from "@solib/cli-base";

describe("Test task isValidTsConfigBuildJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no existing file", async () => {
    await expect(isValidTsConfigBuildJson(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" +
          join(dir, "tsconfig.build.json") +
          "'"
      )
    });
  });

  test("for invalid file", async () => {
    createFiles(dir, { "tsconfig.build.json": "" });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toMatchObject({
      message: expect.stringContaining("Unexpected end of JSON input")
    });
  });

  const validTsConfig: Record<string, unknown> = {
    compilerOptions: {
      allowUmdGlobalAccess: true,
      outDir: "build",
      declaration: true,
      target: "ES5",
      module: "ES6",
      rootDir: "./",
      lib: ["ESNext"],
      moduleResolution: "Node",
      esModuleInterop: true,
      importHelpers: true,
      skipLibCheck: true
    },
    include: ["lib"]
  };

  test("for valid file", async () => {
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(validTsConfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra settings", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.exclude = ["ui/temp"];
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("src");
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).resolves.toBeUndefined();
  });

  test("for empty object", async () => {
    const tsconfig = {};
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions must be object in ${dir}/tsconfig.build.json`
        ),
        new Error(`include must be array in ${dir}/tsconfig.build.json`)
      ])
    );
  });

  test("for missing compilerOptions", async () => {
    const tsconfig = cloneDeep({ include: validTsConfig.include });

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions must be object in ${dir}/tsconfig.build.json`
        )
      ])
    );
  });

  test("for missing include", async () => {
    const tsconfig = cloneDeep({
      compilerOptions: validTsConfig.compilerOptions
    });
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(`include must be array in ${dir}/tsconfig.build.json`)
      ])
    );
  });

  test("for missing default compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    delete (tsconfig.compilerOptions as Record<string, unknown>).outDir;

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions.outDir must be 'build' in ${dir}/tsconfig.build.json`
        )
      ])
    );
  });

  test("for missing default include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.include = [];

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(`include must contain lib in ${dir}/tsconfig.build.json`)
      ])
    );
  });

  test("for extra input compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigBuildJson(dir, { jsx: "react" })
    ).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions.jsx must be 'react' in ${dir}/tsconfig.build.json`
        )
      ])
    );
  });

  test("for extra input include", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigBuildJson(dir, {}, ["ui"])).rejects.toEqual(
      new ErrorSet([
        new Error(`include must contain ui in ${dir}/tsconfig.build.json`)
      ])
    );
  });

  test("for extra input compilerOptions and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigBuildJson(dir, { jsx: "react" })
    ).resolves.toBeUndefined();
  });

  test("for extra input include and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("ui");

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigBuildJson(dir, {}, ["ui"])
    ).resolves.toBeUndefined();
  });
});
