import { createTempDir, deleteDir } from "../../utils";

import { cloneDeep } from "lodash";
import { IContext, Module } from "somod-types";
import { namespace_output } from "../../../src";
import { loadOutputNamespaces } from "../../../src/utils/serverless/namespace";

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
    packageLocation: directory
  });

  test("with no template", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadOutputNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() =>
            null) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: namespace_output,
        values: []
      }
    ]);
  });

  test("with no output", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadOutputNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: { Resources: {} }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: namespace_output,
        values: []
      }
    ]);
  });

  test("with one output", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadOutputNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: { Resources: {}, Outputs: { p1: "v1" } }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: namespace_output,
        values: ["p1"]
      }
    ]);
  });

  test("with multiple outputs", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadOutputNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
              Resources: {},
              Outputs: { p1: "v1", p2: { "Fn::Sub": ["dsfsd", {}] } }
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: namespace_output,
        values: ["p1", "p2"]
      }
    ]);
  });
});
