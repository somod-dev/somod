import buildCommand from "../../src/commands/build";
import { IContext } from "somod-types";
import * as lib from "somod-lib";
import { mockedFunction } from "../utils";
import { addCommonOptions } from "nodejs-cli-runner";

jest.mock("somod-lib", () => {
  const original = jest.requireActual("somod-lib");
  const mocked = {};
  for (const key in original) {
    mocked[key] =
      typeof original[key] === "function" ? jest.fn() : original[key];
  }
  return {
    __esModule: true,
    ...mocked
  };
});

describe("Test command build", () => {
  let output: unknown[][] = [];

  // eslint-disable-next-line no-console
  const originalConsoleLog = console.log;

  const functionsToBeMocked = [
    "buildParameters",
    "buildServerlessTemplate",
    "buildUiConfigYaml",
    "buildUiPublic",
    "compileTypeScript",
    "deleteBuildDir",
    "validatePageData",
    "validatePageExports",
    "isValidTsConfigSomodJson",
    "savePackageJson",
    "updateSodaruModuleKeyInPackageJson",
    "validatePackageJson",
    "validateParametersWithSchema",
    "validateServerlessTemplateWithSchema",
    "validateUiConfigYaml",
    "validateServerlessTemplate",
    "validateUiConfigYamlWithSchema",
    "validateFunctionExports",
    "initializeContext",
    "bundleExtension"
  ];

  const mock = (input: Record<string, unknown>) => {
    for (const key of functionsToBeMocked) {
      // eslint-disable-next-line import/namespace
      mockedFunction(lib[key]).mockImplementation(async (...args) => {
        output.push([key, ...args]);
        return input[key];
      });
    }
    mockedFunction(lib.findRootDir).mockImplementation((...args) => {
      output.push(["findRootDir", ...args]);
      return "/root/dir";
    });
  };

  beforeAll(() => {
    addCommonOptions(buildCommand);
  });

  beforeEach(() => {
    buildCommand.setOptionValue("verbose", undefined);
    buildCommand.setOptionValue("debug", undefined);
    buildCommand.setOptionValue("ui", undefined);
    buildCommand.setOptionValue("serverless", undefined);

    // eslint-disable-next-line no-console
    console.log = originalConsoleLog;
    for (const key of functionsToBeMocked) {
      // eslint-disable-next-line import/namespace
      mockedFunction(lib[key]).mockReset();
    }
    output = [];

    // eslint-disable-next-line no-console
    console.log = jest.fn();
  });

  test("without args", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync([], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with verbose", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync(["-v"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with debug mode", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync(["-d"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with serverless", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync(["--serverless"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with ui", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync(["--ui"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with all options", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [],
          buildHooks: []
        }
      } as IContext
    });
    await buildCommand.parseAsync(["-v", "-d", "--ui", "--serverless"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with hooks from extensions", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir",
        extensionHandler: {
          prebuildHooks: [
            {
              extension: "e1",
              value: context => {
                output.push(["pre-e1", context]);
              }
            },
            {
              extension: "e2",
              value: context => {
                output.push(["pre-e2", context]);
              }
            },
            {
              extension: "e3",
              value: context => {
                output.push(["pre-e3", context]);
              }
            }
          ],
          buildHooks: [
            {
              extension: "e1",
              value: context => {
                output.push(["e1", context]);
              }
            },
            {
              extension: "e2",
              value: context => {
                output.push(["e2", context]);
              }
            },
            {
              extension: "e3",
              value: context => {
                output.push(["e3", context]);
              }
            }
          ]
        }
      } as IContext
    });
    await buildCommand.parseAsync(["-v", "-d", "--ui", "--serverless"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });
});
