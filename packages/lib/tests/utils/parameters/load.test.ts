import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { ErrorSet } from "@solib/cli-base";
import { dump } from "js-yaml";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import {
  loadAllParameterValues,
  loadParameters
} from "../../../src/utils/parameters/load";
import { loadParameterNamespaces } from "../../../src/utils/parameters/namespace";
import { Parameters } from "../../../src/utils/parameters/types";

describe("Test Util parameters.loadParameters", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual({});
  });

  test("for no file in root module", async () => {
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual({});
  });

  test("for empty parameters in build", async () => {
    createFiles(dir, {
      "build/parameters.json": JSON.stringify({ Parameters: {} })
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual({ Parameters: {} });
  });

  test("for parameters in build", async () => {
    const parameters = {
      Parameters: {
        "my.param": { type: "text", default: "one" },
        "my.param2": { type: "text", default: "two" }
      }
    };
    createFiles(dir, {
      "build/parameters.json": JSON.stringify(parameters)
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual(parameters);
  });

  test("for parameters in root", async () => {
    const parameters = {
      Parameters: {
        "my.param": { type: "text", default: "one" },
        "my.param2": { type: "text", default: "two" }
      }
    };
    createFiles(dir, {
      "parameters.yaml": dump(parameters)
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual(parameters);
  });
});

describe("Test Util parameters.loadAllParameterValues", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    ModuleHandler.initialize(dir, [loadParameterNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with failing schema validation", async () => {
    createFiles(dir, {
      "parameters.yaml": dump({
        Parameters: {
          "my.param": { type: "text", default: "one" },
          "my.param2": { type: "text", default: "two" }
        },
        Schemas: {
          "require-param": {
            type: "object",
            required: ["my.param"]
          }
        }
      } as Parameters),
      "parameters.json": JSON.stringify({
        "my.param1": "one",
        "my.param2": "two"
      }),
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    await expect(loadAllParameterValues(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          "DataValidationError:  must have required property 'my.param'"
        )
      ])
    );
  });
});
