import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { file_packageJson, path_pages } from "../../utils/constants";
import { Exports } from "../../utils/exports";
import { readJsonFileStore, ErrorSet } from "@sodaru/cli-base";
import { resolve } from "../../utils/module";
import { getModuleInfo } from "../../utils/moduleInfo";
import { getPageToModulesMap } from "../../utils/pages";

const generatePageStatement = (
  moduleName: string,
  prefix: string,
  exports: Exports
): string => {
  const _exports: string[] = [];
  if (exports.default) {
    _exports.push(`${prefix} as default`);
  }
  exports.named.forEach(namedExport => {
    _exports.push(`${prefix}${namedExport} as ${namedExport}`);
  });
  return `export { ${_exports.join(", ")} } from "${moduleName}";`;
};

export const createPages = async (
  dir: string,
  moduleIndicators: string[],
  validateOnly = false
): Promise<void> => {
  const modules = await getModuleInfo(dir, moduleIndicators);
  const pageToModulesMap = await getPageToModulesMap(modules);

  const dependencyMap: Record<string, string[]> = {};
  modules.forEach(module => {
    dependencyMap[module.name] = module.dependencies;
  });

  const errors: Error[] = [];

  const pageToModuleNameMap: Record<string, string> = {};

  Object.keys(pageToModulesMap).forEach(page => {
    if (pageToModulesMap[page].length == 1) {
      pageToModuleNameMap[page] = pageToModulesMap[page][0].moduleName;
    } else {
      const moduleNamesToResolve = pageToModulesMap[page].map(
        m => m.moduleName
      );
      try {
        pageToModuleNameMap[page] = resolve(
          moduleNamesToResolve,
          dependencyMap
        );
      } catch (e) {
        errors.push(
          new Error(
            `Error while resolving (${moduleNamesToResolve.join(
              ", "
            )}) modules for the page '${page}': ${e.message}`
          )
        );
      }
    }
  });

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }

  if (!validateOnly) {
    // create pages in root dir
    const rootModuleName = (
      await readJsonFileStore(join(dir, file_packageJson))
    ).name as string;

    const createPagePromises = Object.keys(pageToModuleNameMap).map(
      async page => {
        const moduleName = pageToModuleNameMap[page];
        if (moduleName != rootModuleName) {
          const { prefix, exports } = pageToModulesMap[page].filter(
            pageModule => pageModule.moduleName == moduleName
          )[0];

          const content = generatePageStatement(moduleName, prefix, exports);

          const pagePath = join(dir, path_pages, page + ".ts");
          const pageDir = dirname(pagePath);
          await mkdir(pageDir, { recursive: true });
          await writeFile(pagePath, content);
        }
      }
    );

    await Promise.all(createPagePromises);
  }
};
