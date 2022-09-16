import { existsSync } from "fs";
import { listFiles } from "nodejs-file-utils";
import { join } from "path";
import { path_functions, path_serverless } from "../../utils/constants";
import ErrorSet from "../../utils/ErrorSet";
import { get as getExports } from "../../utils/exports";

export const validateFunctionExports = async (dir: string): Promise<void> => {
  const errors: Error[] = [];
  const functionsDir = join(dir, path_serverless, path_functions);
  if (existsSync(functionsDir)) {
    const functions = await listFiles(functionsDir, ".ts");

    functions.forEach(_function => {
      const exports = getExports(join(functionsDir, _function));
      if (!exports.default) {
        errors.push(
          new Error(
            `${path_serverless}/${path_functions}/${_function} must have a default export`
          )
        );
      }
    });
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
