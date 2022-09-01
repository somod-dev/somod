import { createFiles, createTempDir, deleteDir } from "../../utils";

import {
  listAllOutputs,
  loadOutputNamespaces
} from "../../../src/utils/serverless/namespace";
import { Module, ModuleHandler } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";
import { dump } from "js-yaml";
import { namespace_output } from "../../../src";

describe("Test util serverless.loadOutputNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getModuleTemplate = (directory: string): Module => ({
    name: "my-module",
    version: "1.0.0",
    packageLocation: directory,
    namespaces: {}
  });

  test("with no serverless directory", async () => {
    createFiles(dir, { "build/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: []
    });
  });

  test("with empty serverless directory", async () => {
    createFiles(dir, { "build/serverless/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: []
    });
  });

  test("with no output", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({ Resources: {} })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: []
    });
  });

  test("with one output", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {},
        Outputs: { p1: "v1" }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: ["p1"]
    });
  });

  test("with multiple outputs", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {},
        Outputs: { p1: "v1", p2: { "Fn::Sub": ["dsfsd", {}] } }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: ["p1", "p2"]
    });
  });

  test("with output in root dir", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {},
        Outputs: { p1: "v1" }
      }),
      "build/serverless/template.json": JSON.stringify({
        Resources: {},
        Outputs: { p1: "v1", p2: { "Fn::Sub": ["dsfsd", {}] } }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: ["p1"]
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
  "serverless/template.yaml": dump({
    Outputs: {
      "my.param1": "v1"
    }
  }),
  "node_modules/m1/package.json": JSON.stringify({
    name: "m1",
    version: "1.0.0",
    somod: "1.0.0"
  }),
  "node_modules/m1/build/serverless/template.json": JSON.stringify({
    Outputs: {
      "my1.param1": "v2",
      "my1.param2": "v3"
    }
  })
};

describe("Test Util serverless.listAllOutputs", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    ModuleHandler.initialize(dir, [loadOutputNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no output", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
    await expect(listAllOutputs()).resolves.toEqual({});
  });

  test("for only root outputs", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": files["serverless/template.yaml"]
    });
    await expect(listAllOutputs()).resolves.toEqual({
      "my.param1": "my-module"
    });
  });

  test("for parameters in dependency too", async () => {
    createFiles(dir, files);
    await expect(listAllOutputs()).resolves.toEqual({
      "my.param1": "my-module",
      "my1.param1": "m1",
      "my1.param2": "m1"
    });
  });
});
