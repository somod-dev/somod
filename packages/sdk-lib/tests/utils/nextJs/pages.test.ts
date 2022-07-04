import { createFiles, createTempDir, deleteDir } from "../../utils";

import { loadPageNamespaces } from "../../../src/utils/nextJs/pages";
import { Module } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";

describe("Test util page.loadPageNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getModuleTemplate = (directory: string): Module => ({
    type: "njp",
    name: "my-module",
    version: "1.0.0",
    packageLocation: directory,
    namespaces: {}
  });

  test("with no ui directory", async () => {
    createFiles(dir, { "build/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadPageNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "UI Page": [] }
    });
  });

  test("with empty pages directory", async () => {
    createFiles(dir, { "build/ui/pages/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadPageNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "UI Page": [] }
    });
  });

  test("with one page", async () => {
    createFiles(dir, { "build/ui/pages/page1.js": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadPageNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "UI Page": ["page1"] }
    });
  });

  test("with multiple pages", async () => {
    createFiles(dir, {
      "build/ui/pages/page1.js": "",
      "build/ui/pages/sub/page2.js": ""
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadPageNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "UI Page": ["page1", "sub/page2"] }
    });
  });

  test("with pages in root dir", async () => {
    createFiles(dir, {
      "ui/pages/root-page1.tsx": "",
      "ui/pages/sub/root-page2.tsx": "",
      "build/ui/pages/page1.js": "",
      "build/ui/pages/sub/page2.js": ""
    });
    const moduleTemplate = getModuleTemplate(dir);
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await loadPageNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "UI Page": ["root-page1", "sub/root-page2"] }
    });
  });
});
