import { childProcess, ChildProcessError } from "@sodaru/cli-base";
import { mockedFunction } from "@sodev/test-utils";
import { compileTypeScript } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

jest.mock("@sodaru/cli-base", () => {
  const originalModule = jest.requireActual("@sodaru/cli-base");
  return {
    __esModule: true,
    ...originalModule,
    childProcess: jest.fn()
  };
});

describe("Test Task compileTypeScript", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
  });

  afterEach(() => {
    deleteDir(dir);
    mockedFunction(childProcess).mockReset();
  });

  const npxCommand = process.platform == "win32" ? "npx.cmd" : "npx";
  test("for successfull compilation", async () => {
    await expect(compileTypeScript(dir)).resolves.toBeUndefined();
    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.build.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
  });

  test("for no files to compile", async () => {
    mockedFunction(childProcess).mockRejectedValue(
      new ChildProcessError({
        stdout:
          "error TS18003: No inputs were found in config file **** junk ******"
      })
    );
    await expect(compileTypeScript(dir)).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.build.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
  });

  test("for compile errors", async () => {
    mockedFunction(childProcess).mockRejectedValue(
      new ChildProcessError({
        stdout: "Could not compile"
      })
    );
    await expect(compileTypeScript(dir)).rejects.toEqual(
      new ChildProcessError({
        stdout: "Could not compile"
      })
    );

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.build.json"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
  });

  test("noEmit enabled", async () => {
    await expect(compileTypeScript(dir, true)).resolves.toBeUndefined();

    expect(childProcess).toHaveBeenCalledTimes(1);
    expect(childProcess).toHaveBeenCalledWith(
      dir,
      npxCommand,
      ["tsc", "--project", "tsconfig.build.json", "--noEmit"],
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
  });
});
