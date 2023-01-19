import { createFiles, createTempDir, deleteDir } from "../../utils";
import { dump } from "js-yaml";
import { namespace_parameter } from "../../../src";
import {
  loadParameterNamespaces,
  getParameterToModuleMap
} from "../../../src/utils/parameters/namespace";
import { IContext } from "somod-types";

describe("Test Util parameters.loadParameterNamespaces", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module, null)).resolves.toEqual([
      {
        name: namespace_parameter,
        values: []
      }
    ]);
  });

  test("for no file in root module", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      packageLocation: dir,
      root: true
    };
    await expect(loadParameterNamespaces(module, null)).resolves.toEqual([
      {
        name: namespace_parameter,
        values: []
      }
    ]);
  });

  test("for empty parameters in build", async () => {
    createFiles(dir, {
      "build/parameters.json": JSON.stringify({ parameters: {} })
    });
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module, null)).resolves.toEqual([
      {
        name: namespace_parameter,
        values: []
      }
    ]);
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
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module, null)).resolves.toEqual([
      {
        name: namespace_parameter,
        values: Object.keys(parameters.parameters)
      }
    ]);
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
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      packageLocation: dir,
      root: true
    };
    await expect(loadParameterNamespaces(module, null)).resolves.toEqual([
      {
        name: namespace_parameter,
        values: Object.keys(parameters.parameters)
      }
    ]);
  });
});

describe("Test Util parameters.getParameterToModuleMap", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
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
    expect(
      getParameterToModuleMap({
        namespaceHandler: {
          get: (() => []) as IContext["namespaceHandler"]["get"]
        }
      } as IContext)
    ).toEqual({});
  });

  test("for only root parameters.yaml", async () => {
    expect(
      getParameterToModuleMap({
        namespaceHandler: {
          get: (() => [
            { name: "Parameter", value: "my.param1", module: "my-module" }
          ]) as IContext["namespaceHandler"]["get"]
        }
      } as IContext)
    ).toEqual({
      "my.param1": "my-module"
    });
  });

  test("for parameters in dependency too", async () => {
    expect(
      getParameterToModuleMap({
        namespaceHandler: {
          get: (() => [
            { name: "Parameter", value: "my.param1", module: "my-module" },
            { name: "Parameter", value: "my1.param1", module: "m1" },
            { name: "Parameter", value: "my1.param2", module: "m1" }
          ]) as IContext["namespaceHandler"]["get"]
        }
      } as IContext)
    ).toEqual({
      "my.param1": "my-module",
      "my1.param1": "m1",
      "my1.param2": "m1"
    });
  });
});
