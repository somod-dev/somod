import { createFiles, createTempDir, deleteDir } from "../../utils";
import { dump } from "js-yaml";
import {
  loadAllParameterValues,
  loadParameters
} from "../../../src/utils/parameters/load";
import { Parameters } from "../../../src/utils/parameters/types";
import ErrorSet from "../../../src/utils/ErrorSet";
import { IContext } from "somod-types";

describe("Test Util parameters.loadParameters", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        packageLocation: dir
      })
    ).resolves.toEqual({});
  });

  test("for no file in root module", async () => {
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual({});
  });

  test("for empty parameters in build", async () => {
    createFiles(dir, {
      "build/parameters.json": JSON.stringify({ parameters: {} })
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        packageLocation: dir
      })
    ).resolves.toEqual({ parameters: {} });
  });

  test("for parameters in build", async () => {
    const parameters = {
      parameters: {
        "my.param": { type: "string", default: "one" },
        "my.param2": { type: "string", default: "two" }
      }
    };
    createFiles(dir, {
      "build/parameters.json": JSON.stringify(parameters)
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        packageLocation: dir
      })
    ).resolves.toEqual(parameters);
  });

  test("for parameters in root", async () => {
    const parameters = {
      parameters: {
        "my.param": { type: "string", default: "one" },
        "my.param2": { type: "string", default: "two" }
      }
    };
    createFiles(dir, {
      "parameters.yaml": dump(parameters)
    });
    await expect(
      loadParameters({
        name: "my-module",
        version: "1.0.0",
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual(parameters);
  });
});

describe("Test Util parameters.loadAllParameterValues", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with failing schema validation", async () => {
    createFiles(dir, {
      "parameters.yaml": dump({
        parameters: {
          "my.param": { type: "string", default: "one" },
          "my.param2": { type: "number", default: "two" }
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
    await expect(
      loadAllParameterValues({
        dir,
        moduleHandler: {
          getModule: (name => {
            const map = {
              "my-module": {
                module: {
                  name: "my-module",
                  packageLocation: dir,
                  version: "v1.0.0",
                  root: true
                },
                children: [],
                parents: []
              }
            };
            return map[name];
          }) as IContext["moduleHandler"]["getModule"]
        },
        namespaceHandler: {
          get: (() => [
            { name: "Parameter", value: "my.param", module: "my-module" },
            { name: "Parameter", value: "my.param2", module: "my-module" }
          ]) as IContext["namespaceHandler"]["get"]
        }
      } as IContext)
    ).rejects.toEqual(
      new ErrorSet([
        new Error(
          "parameters.json has following errors\n my.param2 must be number"
        )
      ])
    );
  });
});
