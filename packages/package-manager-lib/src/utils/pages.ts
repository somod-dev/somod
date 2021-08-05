import { existsSync } from "fs";
import { join } from "path";
import { Pages } from "../tasks/build/generatePageIndex";
import { file_pagesJson, path_build, path_ui } from "./constants";
import { Exports } from "./exports";
import { read } from "./jsonFileStore";
import { ModuleInfo } from "./moduleInfo";

export type PageToModulesMap = Record<
  string,
  {
    moduleName: string;
    prefix: string;
    exports: Exports;
  }[]
>;

const loadPagesJson = async (packageLocation: string): Promise<Pages> => {
  const pagesJsonPath = join(
    packageLocation,
    path_build,
    path_ui,
    file_pagesJson
  );

  const pages: Pages = existsSync(pagesJsonPath)
    ? ((await read(pagesJsonPath)) as Pages)
    : ({} as Pages);

  return pages;
};

export const getPageToModulesMap = async (
  modules: ModuleInfo[]
): Promise<PageToModulesMap> => {
  const allPages: { module: ModuleInfo; pages: Pages }[] = await Promise.all(
    modules.map(async module => {
      const pages = await loadPagesJson(module.packageLocation);
      return { module, pages };
    })
  );

  const pageToModulesMap: PageToModulesMap = {};

  allPages.forEach(modulePages => {
    const module = modulePages.module;
    Object.keys(modulePages.pages).forEach(page => {
      if (!pageToModulesMap[page]) {
        pageToModulesMap[page] = [];
      }
      const thisPage = modulePages.pages[page];
      pageToModulesMap[page].push({
        moduleName: module.name,
        prefix: thisPage.prefix,
        exports: thisPage.exports
      });
    });
  });

  return pageToModulesMap;
};
