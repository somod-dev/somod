import { exec } from "child_process";
import {
  childProcess,
  ChildProcessError,
  ChildProcessResult
} from "nodejs-cli-runner";

export const execute: typeof childProcess = async (...args) => {
  let result: ChildProcessResult;
  try {
    result = await childProcess(...args);
  } catch (e) {
    result = (e as ChildProcessError).result;
    result["failed"] = true;
  }
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
