import { createFiles, createTempDir, deleteDir } from "../../utils";

import { loadOutputNamespaces } from "../../../src/utils/serverless/namespace";
import { Module } from "../../../src/utils/moduleHandler";
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
