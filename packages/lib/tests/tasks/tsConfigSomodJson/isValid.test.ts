import { cloneDeep } from "lodash";
import { join } from "path";
import { isValidTsConfigSomodJson } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { ErrorSet } from "@solib/cli-base";

describe("Test task isValidTsConfigSomodJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no existing file", async () => {
    await expect(isValidTsConfigSomodJson(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" +
          join(dir, "tsconfig.somod.json") +
          "'"
      )
    });
  });

  test("for invalid file", async () => {
    createFiles(dir, { "tsconfig.somod.json": "" });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toMatchObject({
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
      "tsconfig.somod.json": JSON.stringify(validTsConfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra settings", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.exclude = ["ui/temp"];
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).resolves.toBeUndefined();
  });

  test("for valid file with extra include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("src");
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).resolves.toBeUndefined();
  });

  test("for empty object", async () => {
    const tsconfig = {};
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions must be object in ${dir}/tsconfig.somod.json`
        ),
        new Error(`include must be array in ${dir}/tsconfig.somod.json`)
      ])
    );
  });

  test("for missing compilerOptions", async () => {
    const tsconfig = cloneDeep({ include: validTsConfig.include });

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions must be object in ${dir}/tsconfig.somod.json`
        )
      ])
    );
  });

  test("for missing include", async () => {
    const tsconfig = cloneDeep({
      compilerOptions: validTsConfig.compilerOptions
    });
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(`include must be array in ${dir}/tsconfig.somod.json`)
      ])
    );
  });

  test("for missing default compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    delete (tsconfig.compilerOptions as Record<string, unknown>).outDir;

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions.outDir must be 'build' in ${dir}/tsconfig.somod.json`
        )
      ])
    );
  });

  test("for missing default include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.include = [];

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(`include must contain lib in ${dir}/tsconfig.somod.json`)
      ])
    );
  });

  test("for extra input compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigSomodJson(dir, { jsx: "react" })
    ).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions.jsx must be 'react' in ${dir}/tsconfig.somod.json`
        )
      ])
    );
  });

  test("for extra input include", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(isValidTsConfigSomodJson(dir, {}, ["ui"])).rejects.toEqual(
      new ErrorSet([
        new Error(`include must contain ui in ${dir}/tsconfig.somod.json`)
      ])
    );
  });

  test("for extra input compilerOptions and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigSomodJson(dir, { jsx: "react" })
    ).resolves.toBeUndefined();
  });

  test("for extra input include and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("ui");

    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify(tsconfig)
    });
    await expect(
      isValidTsConfigSomodJson(dir, {}, ["ui"])
    ).resolves.toBeUndefined();
  });
});
