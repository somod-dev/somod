import {
  buildUiPublic,
  compileTypeScript,
  deleteBuildDir,
  doesJsnextMainNotSetInPackageJson,
  doesModuleIsBuildIndexInPackageJson,
  doesNjpIsTrueInPackageJson,
  doesSideEffectsIsFalseInPackageJson,
  generateIndex,
  generatePageIndex,
  isValidTsConfigBuildJson,
  savePackageJson,
  setTypeToModuleInPackageJson
} from "@sodaru/package-manager-lib";
import { Command } from "commander";
import commonOptions, { CommonOptions } from "../commonOptions";
import taskRunner from "../taskRunner";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await taskRunner(setTypeToModuleInPackageJson, verbose, dir);
  await taskRunner(savePackageJson, verbose, dir);

  await Promise.all([
    taskRunner(doesNjpIsTrueInPackageJson, verbose, dir),
    taskRunner(doesModuleIsBuildIndexInPackageJson, verbose, dir),
    taskRunner(doesSideEffectsIsFalseInPackageJson, verbose, dir),
    taskRunner(doesJsnextMainNotSetInPackageJson, verbose, dir),
    taskRunner(isValidTsConfigBuildJson, verbose, dir, { jsx: "react" }, ["ui"])
  ]);

  await taskRunner(deleteBuildDir, verbose, dir);
  await taskRunner(compileTypeScript, verbose, dir);
  await taskRunner(buildUiPublic, verbose, dir);
  await taskRunner(generatePageIndex, verbose, dir);
  await taskRunner(generateIndex, verbose, dir);
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);
commonOptions(buildCommand);

export default buildCommand;
