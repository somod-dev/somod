const errorColor = (str: string) => {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
};

const successColor = (str: string) => {
  // Add ANSI escape codes to display text in red.
  return `\x1b[32m${str}\x1b[0m`;
};

export const logError = (str: string): void => {
  // eslint-disable-next-line no-console
  console.error(errorColor(str));
};

export const logSuccess = (str: string): void => {
  // eslint-disable-next-line no-console
  console.log(successColor(str));
};

export const log = (str: string): void => {
  // eslint-disable-next-line no-console
  console.log(str);
};
