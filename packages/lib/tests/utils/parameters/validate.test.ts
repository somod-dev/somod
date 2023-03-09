import { dump } from "js-yaml";
import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { IContext } from "somod-types";
import ErrorSet from "../../../src/utils/ErrorSet";
import { Parameters } from "../../../src/utils/parameters/types";
import { validateParameterValues } from "../../../src/utils/parameters/validate";

describe("Test Util parameters.loadAllParameterValues", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with successfull validation", async () => {
    createFiles(dir, {
      "parameters.yaml": dump({
        parameters: {
          "my.param": { type: "string", default: "one" },
          "my.param2": { type: "number", default: "two" }
        }
      } as Parameters),
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    await expect(
      validateParameterValues(
        {
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
        } as IContext,
        { "my.param1": "one", "my.param2": 2 }
      )
    ).resolves.toBeUndefined();
  });

  test("with failing schema validation", async () => {
    createFiles(dir, {
      "parameters.yaml": dump({
        parameters: {
          "my.param": { type: "string", default: "one" },
          "my.param2": { type: "number", default: "two" }
        }
      } as Parameters),
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    await expect(
      validateParameterValues(
        {
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
        } as IContext,
        { "my.param1": "one", "my.param2": "two" }
      )
    ).rejects.toEqual(
      new ErrorSet([
        new Error(
          "parameters.json has following errors\n my.param2 must be number"
        )
      ])
    );
  });
});
