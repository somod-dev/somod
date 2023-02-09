import { exec } from "child_process";
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import {
  childProcess,
  ChildProcessError,
  ChildProcessResult
} from "nodejs-cli-runner";
import { join } from "path";

const removeAnsciColor = (strWithColor: string) => {
  // eslint-disable-next-line no-control-regex
  return strWithColor.replace(/\x1b\[\d*m/g, "");
};

export const execute: typeof childProcess = async (...args) => {
  let result: ChildProcessResult;
  try {
    result = await childProcess(...args);
  } catch (e) {
    result = (e as ChildProcessError).result;
    result["failed"] = true;
  }

  result.stdout = removeAnsciColor(result.stdout);
  result.stderr = removeAnsciColor(result.stderr);

  return result;
};

export const execPromise = (cmd: string, dir: string) => {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, { cwd: dir }, (err, stdout, stderr) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(stderr);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const copySource = async (
  source: string,
  target: string,
  ignore: string[]
) => {
  let queue = [...(await readdir(source))];

  const copyPath = async (relativePath: string) => {
    if (!ignore.includes(relativePath)) {
      const absolutePath = join(source, relativePath);
      const stats = await stat(absolutePath);
      if (stats.isDirectory()) {
        await mkdir(join(target, relativePath));
        queue.push(
          ...(await readdir(join(source, relativePath))).map(
            c => relativePath + "/" + c
          )
        );
      } else {
        copyFile(join(source, relativePath), join(target, relativePath));
      }
    }
  };

  while (queue.length > 0) {
    const pathsToCopy = [...queue];
    queue = [];
    await Promise.all(pathsToCopy.map(copyPath));
  }
};
