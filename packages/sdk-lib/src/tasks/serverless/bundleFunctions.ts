import { existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join, normalize } from "path";
import { path_functions, path_slpWorkingDir } from "../../utils/constants";
import { packageLambda } from "../../utils/serverless/packageLambda";

export const bundleFunctions = async (
  dir: string,
  sourceMap = false
): Promise<void> => {
  const functionsDir = normalize(join(dir, path_slpWorkingDir, path_functions));

  if (existsSync(functionsDir)) {
    const dirsToVisit = [functionsDir];
    while (dirsToVisit.length > 0) {
      const dirToVisit = dirsToVisit.shift();
      const dirContent = await readdir(dirToVisit);
      await Promise.all(
        dirContent.map(async fileOrDir => {
          const fileOrDirPath = join(dirToVisit, fileOrDir);
          const stats = await stat(fileOrDirPath);
          if (stats.isDirectory()) {
            dirsToVisit.push(fileOrDirPath);
          } else {
            await packageLambda(dir, fileOrDirPath, sourceMap);
          }
        })
      );
    }
  }
};
