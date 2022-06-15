import { mkdir, writeFile } from "fs/promises";
import { dirname, join, relative, sep } from "path";
import {
  namespace_page,
  path_build,
  path_pages,
  path_ui
} from "../../utils/constants";
import { Exports, get as getExports } from "../../utils/exports";
import { ModuleHandler } from "../../utils/moduleHandler";
import { loadPageNamespaces } from "../../utils/nextJs/pages";

const generatePageStatement = (
  rootDir: string,
  packageLocation: string,
  page: string,
  exports: Exports
): string => {
  const relativePackageLocation = relative(rootDir, packageLocation);
  const pathSegments =
    relativePackageLocation == "" ? [] : relativePackageLocation.split(sep);
  pathSegments.unshift("..");
  pathSegments.push(path_build, path_ui, path_pages, ...page.split("/"));

  const _exports: string[] = [];
  if (exports.default) {
    _exports.push("default");
  }
  _exports.push(...exports.named);

  return `export { ${_exports.join(", ")} } from "${pathSegments.join("/")}";`;
};

export const createPages = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await moduleHandler.getNamespaces(
    Object.fromEntries(
      moduleIndicators.map(moduleType => [moduleType, loadPageNamespaces])
    )
  );

  const allPages = namespaces[namespace_page];

  await Promise.all(
    Object.keys(allPages).map(async page => {
      const moduleName = allPages[page];
      const moduleNode = await moduleHandler.getModule(moduleName);
      const packageLocation = moduleNode.module.packageLocation;

      const exports = getExports(
        join(packageLocation, path_build, path_ui, path_pages, page + ".js")
      );

      const pageContent = generatePageStatement(
        dir,
        packageLocation,
        page,
        exports
      );

      const pagePath = join(dir, path_pages, page + ".ts");
      const pageDir = dirname(pagePath);
      await mkdir(pageDir, { recursive: true });
      await writeFile(pagePath, pageContent);
    })
  );
};
