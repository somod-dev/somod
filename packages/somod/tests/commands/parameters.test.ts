import parametersCommand from "../../src/commands/parameters";
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

describe("Test command parameters", () => {
  let output: unknown[][] = [];

  // eslint-disable-next-line no-console
  const originalConsoleLog = console.log;

  const functionsToBeMocked = [
    "initializeContext",
    "updateParametersFromSAM",
    "validateParameterValues"
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
    addCommonOptions(parametersCommand);
  });

  beforeEach(() => {
    parametersCommand.commands[0].setOptionValue("verbose", undefined);
    parametersCommand.commands[0].setOptionValue("debug", undefined);
    parametersCommand.commands[0].setOptionValue("stackName", undefined);
    parametersCommand.commands[1].setOptionValue("verbose", undefined);
    parametersCommand.commands[1].setOptionValue("debug", undefined);

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

  describe("update subcommand", () => {
    test("without args", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["update"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });

    test("with verbose", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["update", "-v"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });

    test("with debug mode", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["update", "-d"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });

    test("with stackname", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(
        ["update", "--stack-name", "my-stack"],
        {
          from: "user"
        }
      );
      expect(output).toMatchSnapshot();
    });

    test("with all options", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(
        ["update", "-v", "-d", "--stack-name", "my-stack"],
        {
          from: "user"
        }
      );
      expect(output).toMatchSnapshot();
    });
  });

  describe("validate subcommand", () => {
    test("without args", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["validate"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });

    test("with verbose", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["validate", "-v"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });

    test("with debug mode", async () => {
      mock({
        initializeContext: {
          dir: "/root/dir"
        } as IContext
      });
      await parametersCommand.parseAsync(["validate", "-d"], {
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
      await parametersCommand.parseAsync(["validate", "-v", "-d"], {
        from: "user"
      });
      expect(output).toMatchSnapshot();
    });
  });
});
