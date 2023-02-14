import { Command } from "nodejs-cli-runner";

export type SOMODCommandTypeOptions = {
  ui: boolean;
  serverless: boolean;
};

export type DebugModeOptions = {
  debug: boolean;
};

export const addSOMODCommandTypeOptions = (command: Command) => {
  command.option("--ui", "only ui");
  command.option("--serverless", "only serverless");
};

export const addDebugOptions = (command: Command) => {
  command.option("-d, --debug", "Enable Debug mode");
};

export const getSOMODCommandTypeOptions = (
  options: SOMODCommandTypeOptions
): SOMODCommandTypeOptions => {
  const ui = !options.serverless || options.ui;
  const serverless = !options.ui || options.serverless;
  return { ui, serverless };
};
