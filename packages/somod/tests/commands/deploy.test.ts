import deployCommand from "../../src/commands/deploy";
import { BuildAction } from "../../src/commands/build";
import { PrepareAction } from "../../src/commands/prepare";
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

jest.mock("../../src/commands/build", () => {
  return {
    __esModule: true,
    BuildAction: jest.fn()
  };
});

jest.mock("../../src/commands/prepare", () => {
  return {
    __esModule: true,
    PrepareAction: jest.fn()
  };
});

describe("Test command deploy", () => {
  let output: unknown[][] = [];

  // eslint-disable-next-line no-console
  const originalConsoleLog = console.log;

  const functionsToBeMocked = ["samDeploy"];

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
    mockedFunction(BuildAction).mockImplementation(async (...args) => {
      output.push(["BuildAction", ...args]);
    });
    mockedFunction(PrepareAction).mockImplementation(async (...args) => {
      output.push(["PrepareAction", ...args]);
    });
  };

  beforeAll(() => {
    addCommonOptions(deployCommand);
  });

  beforeEach(() => {
    deployCommand.setOptionValue("verbose", undefined);
    deployCommand.setOptionValue("debug", undefined);
    deployCommand.setOptionValue("guided", undefined);

    // eslint-disable-next-line no-console
    console.log = originalConsoleLog;
    for (const key of functionsToBeMocked) {
      // eslint-disable-next-line import/namespace
      mockedFunction(lib[key]).mockReset();
      mockedFunction(BuildAction).mockReset();
      mockedFunction(PrepareAction).mockReset();
    }
    output = [];

    // eslint-disable-next-line no-console
    console.log = jest.fn();
  });

  test("without args", async () => {
    mock({});
    await deployCommand.parseAsync([], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with verbose", async () => {
    mock({});
    await deployCommand.parseAsync(["-v"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with debug mode", async () => {
    mock({});
    await deployCommand.parseAsync(["-d"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with guided", async () => {
    mock({});
    await deployCommand.parseAsync(["-g"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });

  test("with all options", async () => {
    mock({
      initializeContext: {
        dir: "/root/dir"
      } as IContext
    });
    await deployCommand.parseAsync(["-v", "-d", "-g"], {
      from: "user"
    });
    expect(output).toMatchSnapshot();
  });
});
