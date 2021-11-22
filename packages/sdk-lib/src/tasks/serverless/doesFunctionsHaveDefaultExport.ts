import { ErrorSet } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { path_functions, path_serverless } from "../../utils/constants";
import { get as getExports } from "../../utils/exports";

export const doesFunctionsHaveDefaultExport = async (
  dir: string
): Promise<void> => {
  const errors: Error[] = [];
  const functionDir = join(dir, path_serverless, path_functions);
  if (existsSync(functionDir)) {
    const functions = await readdir(functionDir);
    await Promise.all(
      functions.sort().map(async _function => {
        const functionPath = join(functionDir, _function);
        const stats = await stat(functionPath);
        if (!stats.isFile()) {
          errors.push(
            new Error(
              `${functionPath} is not a File. ${path_serverless}/${path_functions} must only contain files`
            )
          );
        } else {
          const exports = getExports(functionPath);
          if (!exports.default) {
            errors.push(
              new Error(`${functionPath} must have a default export`)
            );
          }
        }
      })
    );
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
