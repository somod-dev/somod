import { createFiles, createTempDir, deleteDir } from "../../utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { generate } from "../../../src/utils/parameters/generate";
import { loadParameterNamespaces } from "../../../src/utils/parameters/namespace";

const files = {
  "package.json": JSON.stringify({
    name: "my-module",
    version: "1.0.0",
    somod: "1.0.0",
    dependencies: {
      m1: "^1.0.0"
    }
  }),
  "parameters.yaml": dump({
    Parameters: {
      "my.param1": {
        type: "text",
        default: "p1"
      }
    }
  }),
  "node_modules/m1/package.json": JSON.stringify({
    name: "m1",
    version: "1.0.0",
    somod: "1.0.0"
  }),
  "node_modules/m1/build/parameters.json": JSON.stringify({
    Parameters: {
      "my1.param1": {
        type: "text",
        default: "m1p1"
      },
      "my1.param2": {
        type: "text"
      }
    }
  })
};

describe("Test Util parameters.generate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, [loadParameterNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no parameters.yaml", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    await expect(generate(dir)).resolves.toBeUndefined();
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
    await expect(generate(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "parameters.json"), { encoding: "utf8" })
    ).resolves.toEqual(JSON.stringify({ "my.param1": "p1" }, null, 2) + "\n");
  });

  test("for parameters in dependency too", async () => {
    createFiles(dir, files);
    await expect(generate(dir)).resolves.toBeUndefined();
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
    await expect(generate(dir)).resolves.toBeUndefined();
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
    await expect(generate(dir, true)).resolves.toBeUndefined();
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
