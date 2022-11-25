import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

import {
  listAllOutputs,
  loadOutputNamespaces
} from "../../../src/utils/serverless/namespace";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";
import { dump } from "js-yaml";
import { namespace_output } from "../../../src";
import { Module } from "somod-types";
import { ServerlessTemplateHandler } from "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";

jest.mock(
  "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => {
    return {
      __esModule: true,
      ServerlessTemplateHandler: {
        getServerlessTemplateHandler: jest.fn()
      }
    };
  }
);

describe("Test util serverless.loadOutputNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
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

  test("with no template", async () => {
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      getTemplate: async () => null
    } as unknown as ServerlessTemplateHandler);

    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: []
    });
  });

  test("with no output", async () => {
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      getTemplate: async () => ({
        module: "my-module",
        template: { Resources: {} }
      })
    } as unknown as ServerlessTemplateHandler);

    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: []
    });
  });

  test("with one output", async () => {
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      getTemplate: async () => ({
        module: "my-module",
        template: { Resources: {}, Outputs: { p1: "v1" } }
      })
    } as unknown as ServerlessTemplateHandler);
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: ["p1"]
    });
  });

  test("with multiple outputs", async () => {
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      getTemplate: async () => ({
        module: "my-module",
        template: {
          Resources: {},
          Outputs: { p1: "v1", p2: { "Fn::Sub": ["dsfsd", {}] } }
        }
      })
    } as unknown as ServerlessTemplateHandler);

    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadOutputNamespaces(module)).resolves.toEqual({
      [namespace_output]: ["p1", "p2"]
    });
  });
});

const moduleTemplates = {
  "no-output-module": {},
  "my-module": {
    Outputs: {
      "my.param1": "v1"
    }
  },
  m1: {
    Outputs: {
      "my1.param1": "v2",
      "my1.param2": "v3"
    }
  }
};

const files = {
  "package.json": JSON.stringify({
    name: "my-module",
    version: "1.0.0",
    somod: "1.0.0",
    dependencies: {
      m1: "^1.0.0"
    }
  }),
  "serverless/template.yaml": dump(moduleTemplates["my-module"]),
  "node_modules/m1/package.json": JSON.stringify({
    name: "m1",
    version: "1.0.0",
    somod: "1.0.0"
  }),
  "node_modules/m1/build/serverless/template.json": JSON.stringify(
    moduleTemplates.m1
  )
};

describe("Test Util serverless.listAllOutputs", () => {
  let dir: string = null;

  beforeAll(() => {
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      getTemplate: async (m: string) => ({
        module: m,
        template: moduleTemplates[m]
      })
    } as unknown as ServerlessTemplateHandler);
  });

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler["moduleHandler"] = undefined;
    ModuleHandler.initialize(dir, [loadOutputNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no output", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "no-output-module",
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
      })
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
