import { mkdir } from "fs/promises";
import {
  CommonOptions,
  VersionOptions,
  Command,
  addCommonOptions,
  addVersionOptions,
  logInfo,
  getCommandVersion,
  taskRunner,
  logWarning,
  Argument
} from "nodejs-cli-runner";
import { join } from "path";
import { Config, GetConfig } from "./config";
import { dependenciesInit } from "./tasks/dependenciesInit";
import { eslintInit } from "./tasks/eslintInit";
import { filesInit } from "./tasks/filesInit";
import { gitInit } from "./tasks/gitInit";
import { npmInit } from "./tasks/npmInit";
import { prettierInit } from "./tasks/prettierInit";
import { somodInit } from "./tasks/somodInit";
import { tsconfigInit } from "./tasks/tsconfigInit";
type CreateSomodOptions = CommonOptions &
  VersionOptions & {
    git: boolean;
    prettier: boolean;
    eslint: boolean;
    files: boolean;
    npmPrompt: boolean;
  };

export const decorateCommand = (command: Command) => {
  addCommonOptions(command);
  addVersionOptions(command);
  command.argument(
    "[modName]",
    "module Directory name to create project",
    "my-module"
  );
  command.addArgument(
    new Argument("[mode]", "UI Mode or Serverless Mode")
      .default("ALL")
      .choices(["ALL", "UI", "SERVERLESS"])
  );
  command.option("--no-git", "Skip git initialization");
  command.option("--no-prettier", "Skip prettier initialization");
  command.option("--no-eslint", "Skip eslint initialization");
  command.option("--no-files", "Skip Sample files");
  command.option("--npm-prompt", "Prompt for input during npm init");
};

export const CreateSomodAction = async (
  modName: string,
  mode: "ALL" | "UI" | "SERVERLESS",
  {
    verbose,
    version,
    git,
    prettier,
    eslint,
    files,
    npmPrompt
  }: CreateSomodOptions
) => {
  const dir = process.cwd();

  if (version) {
    logInfo("Version: " + (await getCommandVersion()));
    return;
  }

  const configProviderPath = join(
    process.env.CREATE_SOMOD_CLI_PATH,
    ".create-somod.js"
  );

  const getConfig = (await import("file://" + configProviderPath))
    .default as GetConfig;
  let _config = getConfig(mode);
  if (typeof (_config as Promise<Config>).then == "function") {
    _config = await _config;
  }
  const config = _config as Config;

  const targetDir = join(dir, modName);

  await mkdir(targetDir, { recursive: true });

  await taskRunner(
    `Initialize NPM`,
    npmInit,
    { verbose, progressIndicator: !npmPrompt },
    targetDir,
    verbose,
    npmPrompt
  );

  if (git) {
    await taskRunner(
      `Initialize Git`,
      gitInit,
      { verbose, progressIndicator: true },
      targetDir,
      verbose,
      config.ignorePaths?.git || []
    );
  } else if (verbose) {
    logWarning("Skipped Git initialization");
  }

  if (prettier) {
    await taskRunner(
      `Initialize Prettier`,
      prettierInit,
      { verbose, progressIndicator: true },
      targetDir,
      verbose,
      config.ignorePaths?.prettier || []
    );
  } else if (verbose) {
    logWarning("Skipped Prettier initialization");
  }

  if (eslint) {
    await taskRunner(
      `Initialize Eslint`,
      eslintInit,
      { verbose, progressIndicator: true },
      targetDir,
      verbose,
      config.ignorePaths?.eslint || []
    );
  } else if (verbose) {
    logWarning("Skipped Eslint initialization");
  }

  await taskRunner(
    `Initialize Somod`,
    somodInit,
    { verbose, progressIndicator: true },
    targetDir,
    verbose,
    config.somodName,
    config.somodVersion || null
  );

  await taskRunner(
    `Initialize tsconfig.somod.json`,
    tsconfigInit,
    { verbose, progressIndicator: true },
    targetDir,
    config.tsConfig || {}
  );

  if (files) {
    await taskRunner(
      `Initialize sample files`,
      filesInit,
      { verbose, progressIndicator: true },
      targetDir,
      config.files || {}
    );
  } else if (verbose) {
    logWarning("Skipped Sample files");
  }

  await taskRunner(
    `Initialize dependencies`,
    dependenciesInit,
    { verbose, progressIndicator: true },
    targetDir,
    verbose,
    config.dependencies || {}
  );

  if (typeof config.postInit == "function") {
    await taskRunner(
      `Post Initialization`,
      config.postInit,
      { verbose, progressIndicator: true },
      targetDir,
      verbose
    );
  }
};
