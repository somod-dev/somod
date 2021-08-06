const log = msg => {
  // eslint-disable-next-line no-console
  console.log(msg);
};

const taskRunner = async <T extends unknown[]>(
  task: (...args: T) => Promise<void>,
  verbose: boolean,
  ...args: T
): Promise<void> => {
  const taskName = task.name;
  if (verbose) {
    log(taskName + " Started");
  }
  try {
    await task(...args);
  } catch (e) {
    log(taskName + " Failed");
    throw e;
  }
  if (verbose) {
    log(taskName + " Completed");
  }
};

export default taskRunner;
