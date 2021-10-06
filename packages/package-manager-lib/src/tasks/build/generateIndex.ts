import { logWarning } from "@sodaru-cli/base";
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

/**
 *
 * @param dir
 * @param modules modules to be included in index , relative to ./build directory , default module "lib" is included
 */
export const generateIndex = async (
  dir: string,
  modules: string[] = []
): Promise<void> => {
  const statements: string[] = [];

  const defaultModules = [
    `${path_lib}/${file_index_js.substring(
      0,
      file_index_js.lastIndexOf(".js")
    )}`
  ];

  const _modules = uniq([...defaultModules, ...modules]);

  _modules.forEach(module => {
    const modulePath = join(dir, path_build, module + ".js");
    if (existsSync(modulePath)) {
      const exports = getExports(modulePath);
      if (
        modulePath == join(dir, path_build, path_lib, file_index_js) &&
        exports.default == true
      ) {
        statements.push(`export { default } from "./${path_lib}";`);
      }
      if (exports.named.length > 0) {
        // re-export only named exports
        if (module.endsWith("/index")) {
          module = module.substring(0, module.lastIndexOf("/index"));
        }
        statements.push(`export * from "./${module}";`);
      }
    }
  });

  if (statements.length > 0) {
    const indexPath = join(dir, path_build, file_index_js);
    const indexDTsPath = join(dir, path_build, file_index_dts);
    const indexContent = statements.join("\n");
    await Promise.all([
      writeFile(indexPath, indexContent),
      writeFile(indexDTsPath, indexContent)
    ]);
    getExports(indexPath); // to verify generated index.js has right exports
    getExports(indexDTsPath); // to verify generated index.d.ts has right exports
  } else {
    logWarning(`There is nothing to export from this module`);
  }
};
