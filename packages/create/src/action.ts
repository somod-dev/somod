import { mkdir } from "fs/promises";
import {
  addCommonOptions,
  Command,
  CommonOptions,
  logWarning,
  taskRunner
} from "nodejs-cli-runner";
import { join } from "path";
import { cleanPackageJson } from "./tasks/cleanPackageJson";
import { createTemplateFiles } from "./tasks/createTemplateFiles";
import { gitInit } from "./tasks/gitInit";
import { npmInit } from "./tasks/npmInit";
import { npmInstall } from "./tasks/npmInstall";
import { writeIgnoreFiles } from "./tasks/writeIgnoreFiles";
type CreateSomodOptions = CommonOptions & {
  ui: boolean;
  serverless: boolean;
  version: string;
  templateVersion: string;
  git: boolean;
  prettier: boolean;
  eslint: boolean;
  files: boolean;
  npmPrompt: boolean;
};

export const decorateCommand = (command: Command) => {
  addCommonOptions(command);
  command.argument(
    "[modName]",
    "module Directory name to create project",
    "my-module"
  );

  command.option("--ui", "Initialize only UI");
  command.option("--serverless", "Initialize only Serverless");
  command.option("--version", "somod SDK Version", "latest");
  command.option("--template-version", "somod-template Version", "latest");
  command.option("--no-git", "Skip git initialization");
  command.option("--no-prettier", "Skip prettier initialization");
  command.option("--no-eslint", "Skip eslint initialization");
  command.option("--no-files", "Skip Sample files");
  command.option("--npm-prompt", "Prompt for input during npm init");
};

export const CreateSomodAction = async (
  modName: string,
  {
    verbose,
    ui,
    serverless,
    version,
    templateVersion,
    git,
    prettier,
    eslint,
    files,
    npmPrompt
  }: CreateSomodOptions
) => {
  const dir = process.cwd();

  const targetDir = join(dir, modName);
  if (!ui && !serverless) {
    ui = true;
    serverless = true;
  }

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
      verbose
    );
  } else if (verbose) {
    logWarning("Skipped Git initialization");
  }

  await taskRunner(
    `Install NPM Dependencies`,
    npmInstall,
    { verbose, progressIndicator: true },
    targetDir,
    version,
    templateVersion,
    eslint,
    prettier,
    ui
  );

  if (files) {
    await taskRunner(
      `Create Sample Files`,
      createTemplateFiles,
      { verbose, progressIndicator: true },
      targetDir,
      serverless,
      ui
    );
  } else {
    logWarning("Skipped creating Sample files");
  }

  await taskRunner(
    `Create Ignore Files`,
    writeIgnoreFiles,
    { verbose, progressIndicator: true },
    targetDir,
    serverless,
    ui,
    eslint,
    prettier
  );

  await taskRunner(
    `Cleanup`,
    cleanPackageJson,
    { verbose, progressIndicator: true },
    targetDir,
    serverless,
    ui,
    eslint,
    prettier
  );
};
