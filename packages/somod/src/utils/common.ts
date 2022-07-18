import { Command } from "commander";

export type SOMODCommandTypeOptions = {
  ui: boolean;
  serverless: boolean;
};

export const addSOMODCommandTypeOptions = (command: Command) => {
  command.option("--ui", "only ui");
  command.option("--serverless", "only serverless");
};

export const getSOMODCommandTypeOptions = (
  options: SOMODCommandTypeOptions
): SOMODCommandTypeOptions => {
  const ui = !options.serverless || options.ui;
  const serverless = !options.ui || options.serverless;
  return { ui, serverless };
};
