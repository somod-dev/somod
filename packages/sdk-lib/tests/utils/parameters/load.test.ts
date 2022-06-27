import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { dump } from "js-yaml";
import { loadParameters } from "../../../src/utils/parameters/load";

describe("Test Util parameters.load", () => {
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
        type: "somod",
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
        type: "somod",
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
        type: "somod",
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
        type: "somod",
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
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual(parameters);
  });
});
