import { logWarning } from "@solib/cli-base";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { uniq } from "lodash";
import { join } from "path";
import {
  file_index_dts,
  file_index_js,
  path_build,
  path_lib
} from "../../utils/constants";
import { get as getExports } from "../../utils/exports";

const libModule = `${path_lib}/${file_index_js.substring(
  0,
  file_index_js.lastIndexOf(".js")
)}`;

const getStatements = (
  dir: string,
  modules: string[],
  ext: ".js" | ".d.ts"
): string[] => {
  const statements: string[] = [];
  modules.forEach(module => {
    const modulePath = join(dir, path_build, module + ext);
    if (existsSync(modulePath)) {
      const exports = getExports(modulePath);
      if (module == libModule && exports.default == true) {
        statements.push(`export { default } from "./${path_lib}";`);
      }
      if (module.endsWith("/index")) {
        module = module.substring(0, module.lastIndexOf("/index"));
      }
      statements.push(`export * from "./${module}";`);
    }
  });

  return statements;
};

/**
 *
 * @param dir
 * @param modules modules to be included in index , relative to ./build directory , default module "lib" is included
 */
export const generateIndex = async (
  dir: string,
  modules: string[] = []
): Promise<void> => {
  const defaultModules = [libModule];

  const _modules = uniq([...defaultModules, ...modules]);

  const jsStatements = getStatements(dir, _modules, ".js");
  const dTsStatements = getStatements(dir, _modules, ".d.ts");

  if (jsStatements.length > 0 || dTsStatements.length > 0) {
    const indexPath = join(dir, path_build, file_index_js);
    const indexDTsPath = join(dir, path_build, file_index_dts);
    const indexContent = jsStatements.join("\n");
    const indexDTsContent = dTsStatements.join("\n");
    await Promise.all([
      writeFile(indexPath, indexContent),
      writeFile(indexDTsPath, indexDTsContent)
    ]);
    getExports(indexPath); // to verify generated index.js has right exports
    getExports(indexDTsPath); // to verify generated index.d.ts has right exports
  } else {
    logWarning(`There is nothing to export from this module`);
  }
};
