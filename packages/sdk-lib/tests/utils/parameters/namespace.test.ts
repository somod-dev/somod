import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { dump } from "js-yaml";
import {
  loadParameterNamespaces,
  listAllParameters
} from "../../../src/utils/parameters/namespace";

describe("Test Util parameters.loadParameterNamespaces", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({ ...module, namespaces: { Parameter: [] } });
  });

  test("for no file in root module", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir,
      root: true
    };
    await expect(loadParameterNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({ ...module, namespaces: { Parameter: [] } });
  });

  test("for empty parameters in build", async () => {
    createFiles(dir, {
      "build/parameters.json": JSON.stringify({ Parameters: {} })
    });
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({ ...module, namespaces: { Parameter: [] } });
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
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadParameterNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: { Parameter: Object.keys(parameters.Parameters) }
    });
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
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir,
      root: true
    };
    await expect(loadParameterNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: { Parameter: Object.keys(parameters.Parameters) }
    });
  });
});

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
        type: "text",
        default: "m1p2"
      }
    }
  })
};

describe("Test Util parameters.listAllParameters", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
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
    await expect(listAllParameters(dir)).resolves.toEqual([]);
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
    await expect(listAllParameters(dir)).resolves.toEqual(["my.param1"]);
  });

  test("for parameters in dependency too", async () => {
    createFiles(dir, files);
    await expect(listAllParameters(dir)).resolves.toEqual([
      "my.param1",
      "my1.param1",
      "my1.param2"
    ]);
  });
});
