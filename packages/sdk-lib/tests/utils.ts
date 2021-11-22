import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "fs";
import { tmpdir } from "os";
import { join as pathJoin, dirname } from "path";
import { sync as rimrafSync } from "rimraf";

export const createTempDir = (): string => {
  const tempDirPath = mkdtempSync(pathJoin(tmpdir(), "pml-test-"));
  const tempDirPathUnixStyle = tempDirPath.split("\\").join("/");
  return tempDirPathUnixStyle;
};

export const deleteDir = (dir: string): void => {
  rimrafSync(dir);
};

export const createFiles = (
  dir: string,
  paths: Record<string, string>
): void => {
  Object.keys(paths).forEach(path => {
    if (path.endsWith("/")) {
      const completePath = pathJoin(dir, path);
      mkdirSync(completePath, { recursive: true });
    } else {
      const data = paths[path];
      const completePath = pathJoin(dir, path);
      const pathDirectory = dirname(completePath);
      mkdirSync(pathDirectory, { recursive: true });
      writeFileSync(completePath, data);
    }
  });
};

export const readFiles = (dir: string): Record<string, string> => {
  if (!existsSync(dir)) {
    return {};
  }

  const files: Record<string, string> = {};
  const queue: string[] = ["."];
  let currentDir = queue.shift();

  while (currentDir) {
    const completePath = pathJoin(dir, currentDir);
    const dirFiles = readdirSync(completePath);
    if (dirFiles.length == 0) {
      dirFiles[currentDir + "/"] = "";
    }
    dirFiles.forEach(file => {
      const filePath = pathJoin(completePath, file);
      const stats = statSync(filePath);
      if (stats.isDirectory()) {
        queue.push(pathJoin(currentDir, file));
      } else if (stats.isFile()) {
        const data = readFileSync(filePath, { encoding: "utf8" });
        files[pathJoin(currentDir, file).split("\\").join("/")] = data;
      }
    });

    currentDir = queue.shift();
  }
  return files;
};
