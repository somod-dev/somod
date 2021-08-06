import { Command } from "commander";

export type CommonOptions = {
  verbose: boolean;
};

const commonOptions = (command: Command): void => {
  command.option("-v, --verbose", "enable verbose");
};

export default commonOptions;
