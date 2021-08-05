import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, relative, dirname } from "path";
import { file_pagesJson, path_build, path_pages, path_ui } from "./constants";
import { get as getExports, Exports } from "./exports";
import { read } from "./jsonFileStore";
import { ModuleInfo } from "./moduleInfo";
import unixStylePath from "./unixStylePath";

export type Pages = Record<string, { prefix: string; exports: Exports }>;

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

const getRelativePath = (dir: string, page: string): string => {
  const toPage = join(dir, path_ui, path_pages, page);
  const fromPage = join(dir, path_pages, page);
  const fromPageDir = dirname(fromPage);
  const relativePath = relative(fromPageDir, toPage);
  const relativePathWoExtension = relativePath.substring(
    0,
    relativePath.lastIndexOf(".")
  );
  return unixStylePath(relativePathWoExtension);
};

export const exportRootModulePage = async (
  dir: string,
  page: string
): Promise<void> => {
  const module = getRelativePath(dir, page);
  const exports = getExports(join(dir, path_ui, path_pages, page));
  const targetPage = join(dir, path_pages, page);
  const targetPageTs =
    targetPage.substring(0, targetPage.lastIndexOf(".")) + ".ts";

  const targetPageTsDir = dirname(targetPageTs);
  await mkdir(targetPageTsDir, { recursive: true });

  const _exports: string[] = [];
  if (exports.default) {
    _exports.push("default");
  }
  exports.named.forEach(namedExport => {
    _exports.push(namedExport);
  });

  await writeFile(
    targetPageTs,
    `export { ${_exports.join(", ")} } from "${module}";`
  );
};
