import {
  createPages,
  createPublicAssets,
  createRootModulePages,
  createRootModulePublicAssets,
  savePackageJson,
  setTypeToCommonjsInPackageJson,
  startNextDev,
  validateModuleDependency,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@sodaru/package-manager-lib";
import { Command } from "commander";
import { BuildAction } from "./build";
import commonOptions, { CommonOptions } from "../commonOptions";
import taskRunner from "../taskRunner";

export const DevAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await BuildAction({ verbose });

  await taskRunner(validateModuleDependency, verbose, dir, ["njp"]);
  await Promise.all([
    taskRunner(createPages, verbose, dir, ["njp"]),
    taskRunner(createPublicAssets, verbose, dir, ["njp"])
  ]);

  await Promise.all([
    taskRunner(createRootModulePages, verbose, dir),
    taskRunner(createRootModulePublicAssets, verbose, dir)
  ]);

  watchRootModulePages(dir);
  watchRootModulePublicAssets(dir);

  // NextJs Dev server needs type = commonjs in package.json
  await taskRunner(setTypeToCommonjsInPackageJson, verbose, dir);
  await taskRunner(savePackageJson, verbose, dir);

  await taskRunner(startNextDev, verbose, dir);
};

const devCommand = new Command("dev");

devCommand.action(DevAction);
commonOptions(devCommand);

export default devCommand;
