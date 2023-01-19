import { createFiles, createTempDir, deleteDir } from "../../utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { generate } from "../../../src/utils/parameters/generate";
import { IContext, ModuleNamespace } from "somod-types";

const files = {
  "parameters.yaml": dump({
    parameters: {
      "my.param1": {
        type: "string",
        default: "p1"
      }
    }
  }),
  "node_modules/m1/build/parameters.json": JSON.stringify({
    parameters: {
      "my1.param1": {
        type: "string",
        default: "m1p1"
      },
      "my1.param2": {
        type: "number"
      }
    }
  })
};

const getContext = (dir: string, parameters: ModuleNamespace[]) =>
  ({
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
          },
          m1: {
            module: {
              name: "m1",
              packageLocation: join(dir, "node_modules/m1"),
              version: "v1.0.0",
              root: false
            },
            children: [],
            parents: []
          }
        };
        return map[name];
      }) as IContext["moduleHandler"]["getModule"]
    },
    namespaceHandler: {
      get: (() => parameters) as IContext["namespaceHandler"]["get"]
    }
  } as IContext);

describe("Test Util parameters.generate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    await expect(generate(getContext(dir, []))).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}\n");
  });

  test("for only root parameters.yaml", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "parameters.yaml": files["parameters.yaml"]
    });
    await expect(
      generate(
        getContext(dir, [
          { name: "Parameter", value: "my.param1", module: "my-module" }
        ])
      )
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(JSON.stringify({ "my.param1": "p1" }, null, 2) + "\n");
  });

  test("for parameters in dependency too", async () => {
    createFiles(dir, files);
    await expect(
      generate(
        getContext(dir, [
          { name: "Parameter", value: "my.param1", module: "my-module" },
          { name: "Parameter", value: "my1.param1", module: "m1" },
          { name: "Parameter", value: "my1.param2", module: "m1" }
        ])
      )
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify(
        { "my.param1": "p1", "my1.param1": "m1p1", "my1.param2": null },
        null,
        2
      ) + "\n"
    );
  });

  test("for prior parameters and override = false", async () => {
    createFiles(dir, {
      "parameters.json": JSON.stringify(
        { "my.param1": "param1", "my1.param1": "m1p1", "m0.param1": "m0p1" },
        null,
        2
      ),
      ...files
    });
    await expect(
      generate(
        getContext(dir, [
          { name: "Parameter", value: "my.param1", module: "my-module" },
          { name: "Parameter", value: "my1.param1", module: "m1" },
          { name: "Parameter", value: "my1.param2", module: "m1" }
        ])
      )
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify(
        {
          "my.param1": "param1",
          "my1.param1": "m1p1",
          "my1.param2": null,
          "m0.param1": "m0p1"
        },
        null,
        2
      ) + "\n"
    );
  });

  test("for prior parameters and override = true", async () => {
    createFiles(dir, {
      "parameters.json": JSON.stringify(
        { "my.param1": "param1", "my1.param1": "m1p1", "m0.param1": "m0p1" },
        null,
        2
      ),
      ...files
    });
    await expect(
      generate(
        getContext(dir, [
          { name: "Parameter", value: "my.param1", module: "my-module" },
          { name: "Parameter", value: "my1.param1", module: "m1" },
          { name: "Parameter", value: "my1.param2", module: "m1" }
        ]),
        true
      )
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify(
        {
          "my.param1": "p1",
          "my1.param1": "m1p1",
          "m0.param1": "m0p1",
          "my1.param2": null
        },
        null,
        2
      ) + "\n"
    );
  });
});
