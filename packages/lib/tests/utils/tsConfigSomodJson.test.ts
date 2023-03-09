import {
  createFiles,
  createTempDir,
  deleteDir,
  unixStylePath
} from "nodejs-file-utils";
import { join } from "path";
import { IContext } from "somod-types";
import ErrorSet from "../../src/utils/ErrorSet";
import { validate } from "../../src/utils/tsConfigSomodJson";

describe("test util tsConfigSomodJson.validate", () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    filePath = unixStylePath(join(dir, "tsconfig.somod.json"));
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no tsconfig.somod.json", async () => {
    await expect(validate({ dir } as IContext)).rejects.toMatchObject({
      message: `ENOENT: no such file or directory, open '${filePath}'`
    });
  });

  test("for empty tsconfig.somod.json", async () => {
    createFiles(dir, { "tsconfig.somod.json": "{}" });
    await expect(validate({ dir } as IContext)).rejects.toEqual(
      new ErrorSet([
        new Error(`compilerOptions must be object in ${filePath}`),
        new Error(`include must be array in ${filePath}`)
      ])
    );
  });

  test("for complete invalid tsconfig.somod.json", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {},
        include: []
      })
    });
    await expect(validate({ dir } as IContext)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `compilerOptions.allowUmdGlobalAccess must be 'true' in ${filePath}`
        ),
        new Error(`compilerOptions.outDir must be 'build' in ${filePath}`),
        new Error(`compilerOptions.declaration must be 'true' in ${filePath}`),
        new Error(`compilerOptions.target must be 'ES5' in ${filePath}`),
        new Error(`compilerOptions.module must be 'ESNext' in ${filePath}`),
        new Error(`compilerOptions.rootDir must be './' in ${filePath}`),
        new Error(
          `compilerOptions.moduleResolution must be 'Node' in ${filePath}`
        ),
        new Error(
          `compilerOptions.esModuleInterop must be 'true' in ${filePath}`
        ),
        new Error(
          `compilerOptions.importHelpers must be 'true' in ${filePath}`
        ),
        new Error(`compilerOptions.skipLibCheck must be 'true' in ${filePath}`)
      ])
    );
  });

  test("for partial invalid tsconfig.somod.json", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "dist",
          target: "ES5",
          module: "ESM",
          moduleResolution: "Node",
          esModuleInterop: true,
          skipLibCheck: true
        },
        include: ["lib"]
      })
    });
    await expect(validate({ dir } as IContext)).rejects.toEqual(
      new ErrorSet([
        new Error(`compilerOptions.outDir must be 'build' in ${filePath}`),
        new Error(`compilerOptions.declaration must be 'true' in ${filePath}`),
        new Error(`compilerOptions.module must be 'ESNext' in ${filePath}`),
        new Error(`compilerOptions.rootDir must be './' in ${filePath}`),
        new Error(`compilerOptions.importHelpers must be 'true' in ${filePath}`)
      ])
    );
  });

  test("for valid tsconfig.somod.json when isUI = false and isServerless = false", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true
        },
        include: ["lib"]
      })
    });
    await expect(validate({ dir } as IContext)).resolves.toBeUndefined();
  });

  test("for invalid tsconfig.somod.json when isUI = false and isServerless = true", async () => {
    createFiles(dir, {
      "serverless/functions/a.ts": "",
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true
        },
        include: ["lib"]
      })
    });
    await expect(
      validate({ dir, isServerless: true } as IContext)
    ).rejects.toEqual(
      new ErrorSet([
        new Error(`include must contain 'serverless' in ${filePath}`)
      ])
    );
  });

  test("for valid tsconfig.somod.json when isUI = false and isServerless = true", async () => {
    createFiles(dir, {
      "serverless/functions/a.ts": "",
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true
        },
        include: ["lib", "serverless"]
      })
    });
    await expect(
      validate({ dir, isServerless: true } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for invalid tsconfig.somod.json when isUI = true and isServerless = false", async () => {
    createFiles(dir, {
      "ui/pages/a.tsx": "",
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true
        },
        include: ["lib"]
      })
    });
    await expect(validate({ dir, isUI: true } as IContext)).rejects.toEqual(
      new ErrorSet([
        new Error(`compilerOptions.jsx must be 'react-jsx' in ${filePath}`),
        new Error(`include must contain 'ui' in ${filePath}`)
      ])
    );
  });

  test("for valid tsconfig.somod.json when isUI = true and isServerless = false", async () => {
    createFiles(dir, {
      "ui/pages/a.tsx": "",
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true,
          jsx: "react-jsx"
        },
        include: ["lib", "ui"]
      })
    });
    await expect(
      validate({ dir, isUI: true } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for invalid tsconfig.somod.json when isUI = true and isServerless = true but no files to compile", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true
        },
        include: []
      })
    });
    await expect(
      validate({ dir, isUI: true } as IContext)
    ).resolves.toBeUndefined();
  });

  test("for valid tsconfig.somod.json with extra configuration", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": JSON.stringify({
        compilerOptions: {
          allowUmdGlobalAccess: true,
          outDir: "build",
          declaration: true,
          target: "ES5",
          module: "ESNext",
          rootDir: "./",
          moduleResolution: "Node",
          esModuleInterop: true,
          importHelpers: true,
          skipLibCheck: true,
          aaaa: "waw"
        },
        include: ["lib", "my-lib"]
      })
    });
    await expect(validate({ dir } as IContext)).resolves.toBeUndefined();
  });
});
