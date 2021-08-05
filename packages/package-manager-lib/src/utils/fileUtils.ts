import { mkdirSync, readdir, stat } from "fs";
import {
  copyFile,
  readdir as readdirPromise,
  stat as statPromise
} from "fs/promises";
import { join as pathJoin } from "path";
import unixStylePath from "./unixStylePath";

export const cwd = (): string => {
  return process.cwd();
};

const copyPath = (source: string, target: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    stat(source, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        if (stats.isDirectory()) {
          copyDirectory(source, target).then(resolve).catch(reject);
        } else if (stats.isFile()) {
          copyFile(source, target).then(resolve).catch(reject);
        } else {
          resolve();
        }
      }
    });
  });
};

export const copyDirectory = (
  source: string,
  target: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    mkdirSync(target, { recursive: true });
    readdir(source, (err, files) => {
      if (err) {
        reject(err);
      }
      Promise.all(
        files.map(async file => {
          await copyPath(pathJoin(source, file), pathJoin(target, file));
        })
      )
        .then(() => {
          resolve();
        })
        .catch(reject);
    });
  });
};

export const listFiles = async (
  dir: string,
  suffix?: string
): Promise<string[]> => {
  if (!dir || dir.trim().length == 0) {
    throw new Error("dir can not be empty");
  }
  const filePaths: string[] = [];
  const queue: string[] = ["."];
  let currentDir = queue.shift();
  while (currentDir) {
    const files = await readdirPromise(pathJoin(dir, currentDir));
    await Promise.all(
      files.map(async file => {
        const stats = await statPromise(pathJoin(dir, currentDir, file));
        if (stats.isDirectory()) {
          queue.push(pathJoin(currentDir, file));
        } else if (!suffix || file.endsWith(suffix)) {
          filePaths.push(pathJoin(currentDir, file));
        }
      })
    );
    currentDir = queue.shift();
  }
  filePaths.sort();
  const normalizedFiles = filePaths.map(unixStylePath);
  return normalizedFiles;
};
