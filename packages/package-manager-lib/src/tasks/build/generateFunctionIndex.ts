import { existsSync } from "fs";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";
import {
  path_build,
  path_functions,
  path_serverless,
  file_functionIndex_js,
  file_functionIndex_dts
} from "../../utils/constants";

export const generateFunctionIndex = async (dir: string): Promise<void> => {
  const functionsDir = join(dir, path_build, path_serverless, path_functions);
  if (existsSync(functionsDir)) {
    const functions = await readdir(functionsDir);
    const statements = functions
      .filter(functionName => functionName.endsWith(".js")) // filter out .d.ts files
      .map(functionName => {
        const moduleName = functionName.substring(
          0,
          functionName.lastIndexOf(".js")
        );
        return `export { default as ${moduleName} } from "./${path_functions}/${moduleName}";`;
      });

    if (statements.length > 0) {
      const functionIndexContent = statements.join("\n");
      const functionIndexPath = join(
        dir,
        path_build,
        path_serverless,
        file_functionIndex_js
      );
      const functionIndexDtsPath = join(
        dir,
        path_build,
        path_serverless,
        file_functionIndex_dts
      );

      await Promise.all([
        writeFile(functionIndexPath, functionIndexContent),
        writeFile(functionIndexDtsPath, functionIndexContent)
      ]);
    }
  }
};
