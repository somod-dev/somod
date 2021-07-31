import { cloneDeep } from "lodash";
import { join } from "path";
import { updateTsConfigBuildJson } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { read } from "../../../src/utils/jsonFileStore";

describe("Test task updateTsConfigBuildJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const validTsConfig: Record<string, unknown> = {
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
    include: ["lib"]
  };

  test("for no existing file", async () => {
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for invalid file", async () => {
    createFiles(dir, { "tsconfig.build.json": "" });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for valid file", async () => {
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(validTsConfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for valid file with extra settings", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.exclude = ["ui/temp"];
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      tsconfig
    );
  });

  test("for valid file with extra compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      tsconfig
    );
  });

  test("for valid file with extra include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("src");
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      tsconfig
    );
  });

  test("for empty object", async () => {
    const tsconfig = {};
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for missing compilerOptions", async () => {
    const tsconfig = cloneDeep({ include: validTsConfig.include });

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for missing include", async () => {
    const tsconfig = cloneDeep({
      compilerOptions: validTsConfig.compilerOptions
    });
    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for missing default compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    delete (tsconfig.compilerOptions as Record<string, unknown>).outDir;

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for missing default include", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    tsconfig.include = [];

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(updateTsConfigBuildJson(dir)).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      validTsConfig
    );
  });

  test("for extra input compilerOptions", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      updateTsConfigBuildJson(dir, { jsx: "react" })
    ).resolves.toBeUndefined();
    const expectedtsconfig = cloneDeep(validTsConfig);
    (expectedtsconfig.compilerOptions as Record<string, unknown>).jsx = "react";
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      expectedtsconfig
    );
  });

  test("for extra input include", async () => {
    const tsconfig = cloneDeep(validTsConfig);

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      updateTsConfigBuildJson(dir, {}, ["ui"])
    ).resolves.toBeUndefined();
    const expectedtsconfig = cloneDeep(validTsConfig);
    (expectedtsconfig.include as string[]).push("ui");
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      expectedtsconfig
    );
  });

  test("for extra input compilerOptions and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.compilerOptions as Record<string, unknown>).jsx = "react";

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      updateTsConfigBuildJson(dir, { jsx: "react" })
    ).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      tsconfig
    );
  });

  test("for extra input include and valid file", async () => {
    const tsconfig = cloneDeep(validTsConfig);
    (tsconfig.include as string[]).push("ui");

    createFiles(dir, {
      "tsconfig.build.json": JSON.stringify(tsconfig)
    });
    await expect(
      updateTsConfigBuildJson(dir, {}, ["ui"])
    ).resolves.toBeUndefined();
    await expect(read(join(dir, "tsconfig.build.json"))).resolves.toEqual(
      tsconfig
    );
  });
});
