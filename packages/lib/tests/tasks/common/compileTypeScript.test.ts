import { childProcess, ChildProcessError, logWarning } from "nodejs-cli-runner";
import { IContext } from "somod-types";
import { compileTypeScript } from "../../../src";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("nodejs-cli-runner", () => {
  const originalModule = jest.requireActual("nodejs-cli-runner");
  return {
    __esModule: true,
    ...originalModule,
    childProcess: jest.fn(),
    logWarning: jest.fn()
  };
});

describe("Test Task compileTypeScript", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(childProcess).mockReset();
    mockedFunction(logWarning).mockReset();
  });

  const npxCommand = process.platform == "win32" ? "npx.cmd" : "npx";
  test("for successfull compilation", async () => {
    createFiles(dir, { "tsconfig.somod.json": "{}" });
    await expect(
      compileTypeScript({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for no tsconfig.somod.json", async () => {
    await expect(
      compileTypeScript({ dir } as IContext)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(0);
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for no tsconfig.somod.json and when verbose = true", async () => {
    await expect(
      compileTypeScript({ dir } as IContext, true)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(0);
    expect(logWarning).toHaveBeenCalledTimes(1);
    expect(logWarning).toHaveBeenCalledWith(
      "Skipping TypeScript Compilation : tsconfig.somod.json not Found."
    );
  });

  test("for compile errors", async () => {
    createFiles(dir, { "tsconfig.somod.json": "{}" });
    mockedFunction(childProcess).mockRejectedValue(
      new ChildProcessError("npx tsc --project tsconfig.somod.json", {
        stdout: "Could not compile"
      })
    );
    await expect(compileTypeScript({ dir } as IContext)).rejects.toEqual(
      new ChildProcessError("npx tsc --project tsconfig.somod.json", {
        stdout: "Could not compile"
      })
    );

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for only ui and serverless entries in tsconfig include", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": '{"include": ["lib", "serverless", "ui"]}'
    });

    await expect(
      compileTypeScript({ dir, isUI: true } as IContext)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json.ui"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for only ui and no serverless entries in tsconfig include", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": '{"include": ["lib", "ui"]}'
    });

    await expect(
      compileTypeScript({ dir, isUI: true } as IContext)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for only serverless and ui entries in tsconfig include", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": '{"include": ["lib", "serverless", "ui"]}'
    });

    await expect(
      compileTypeScript({ dir, isServerless: true } as IContext)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json.serverless"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });

  test("for only serverless and no ui entries in tsconfig include", async () => {
    createFiles(dir, {
      "tsconfig.somod.json": '{"include": ["lib", "serverless"]}'
    });

    await expect(
      compileTypeScript({ dir, isServerless: true } as IContext)
    ).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.somod.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
    expect(logWarning).toHaveBeenCalledTimes(0);
  });
});
