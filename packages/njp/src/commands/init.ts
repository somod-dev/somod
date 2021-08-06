import {
  initGit,
  initLib,
  initWelcomePage,
  saveGitIgnore,
  savePackageJson,
  saveTsConfigBuildJson,
  setModuleInPackageJson,
  setNjpInPackageJson,
  setSideEffectsInPackageJson,
  setTypeInPackageJson,
  unsetJsnextMainInPackageJson,
  updateGitIgnore,
  updateTsConfigBuildJson
} from "@sodaru/package-manager-lib";
import { Command } from "commander";
import commonOptions, { CommonOptions } from "../commonOptions";
import taskRunner from "../taskRunner";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(setNjpInPackageJson, verbose, dir);
  await taskRunner(setModuleInPackageJson, verbose, dir);
  await taskRunner(setTypeInPackageJson, verbose, dir);
  await taskRunner(setSideEffectsInPackageJson, verbose, dir);
  await taskRunner(unsetJsnextMainInPackageJson, verbose, dir);

  await Promise.all([
    taskRunner(initGit, verbose, dir),

    taskRunner(updateGitIgnore, verbose, dir, [
      ".next",
      "tsconfig.json",
      "/pages",
      "/public"
    ]),

    taskRunner(updateTsConfigBuildJson, verbose, dir, { jsx: "react" }, ["ui"]),

    taskRunner(initLib, verbose, dir),
    taskRunner(initWelcomePage, verbose, dir)
  ]);

  await Promise.all([
    taskRunner(savePackageJson, verbose, dir),
    taskRunner(saveGitIgnore, verbose, dir),
    taskRunner(saveTsConfigBuildJson, verbose, dir)
  ]);
};

const initCommand = new Command("init");

initCommand.action(InitAction);
commonOptions(initCommand);

export default initCommand;
