import { createFiles, createTempDir, deleteDir } from "../../utils";
import { loadPublicAssetNamespaces } from "../../../src/utils/nextJs/publicAssets";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";
import { namespace_public } from "../../../src";
import { Module } from "@somod/types";

describe("Test util publicAssets.loadPublicAssetNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
    ModuleHandler.initialize(dir, [loadPublicAssetNamespaces]);
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

  test("with no ui directory", async () => {
    createFiles(dir, { "build/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadPublicAssetNamespaces(module)).resolves.toEqual({
      [namespace_public]: []
    });
  });

  test("with empty public directory", async () => {
    createFiles(dir, { "build/ui/public/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadPublicAssetNamespaces(module)).resolves.toEqual({
      [namespace_public]: []
    });
  });

  test("with one page", async () => {
    createFiles(dir, { "build/ui/public/page1.html": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadPublicAssetNamespaces(module)).resolves.toEqual({
      [namespace_public]: ["page1.html"]
    });
  });

  test("with multiple public", async () => {
    createFiles(dir, {
      "build/ui/public/page1.html": "",
      "build/ui/public/sub/page2.css": ""
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadPublicAssetNamespaces(module)).resolves.toEqual({
      [namespace_public]: ["page1.html", "sub/page2.css"]
    });
  });

  test("with public in root dir", async () => {
    createFiles(dir, {
      "ui/public/root-page1.html": "",
      "ui/public/sub/root-page2.css": "",
      "build/ui/public/page1.html": "",
      "build/ui/public/sub/page2.css": ""
    });
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadPublicAssetNamespaces(module)).resolves.toEqual({
      [namespace_public]: ["root-page1.html", "sub/root-page2.css"]
    });
  });
});
