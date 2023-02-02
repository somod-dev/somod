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
