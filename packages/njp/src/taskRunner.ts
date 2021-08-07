import { log, logError, logSuccess } from "./output";

const taskRunner = async <T extends unknown[]>(
  name: string,
  task: (...args: T) => Promise<unknown>,
  verbose: boolean,
  ...args: T
): Promise<unknown> => {
  const taskName = name;
  if (verbose) {
    log(taskName + " :- Started");
  }
  try {
    const result = await task(...args);
    if (verbose) {
      logSuccess(taskName + " :- Completed");
    }
    return result;
  } catch (e) {
    logError(taskName + " :- Failed");
    throw e;
  }
};

export default taskRunner;
