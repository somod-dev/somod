import { dump } from "js-yaml";
import { IContext } from "somod-types";
import {
  loadAllParameterValues,
  loadParameters
} from "../../../src/utils/parameters/load";
import { createFiles, createTempDir, deleteDir } from "../../utils";

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

  test("without parameters.json", async () => {
    await expect(loadAllParameterValues({ dir } as IContext)).resolves.toEqual(
      {}
    );
  });

  test("with parameters.json", async () => {
    createFiles(dir, {
      "parameters.json": JSON.stringify({
        "my.param1": "one",
        "my.param2": "two"
      })
    });
    await expect(
      loadAllParameterValues({
        dir
      } as IContext)
    ).resolves.toEqual({
      "my.param1": "one",
      "my.param2": "two"
    });
  });
});
