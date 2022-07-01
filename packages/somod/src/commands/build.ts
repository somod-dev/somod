import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildParameters,
  buildServerlessTemplate,
  buildUiConfigYaml,
  buildUiPublic,
  bundleFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesPagesHaveDefaultExport,
  doesServerlessFunctionsHaveDefaultExport,
  file_configYaml,
  file_packageJson,
  file_parametersYaml,
  file_templateYaml,
  file_tsConfigBuildJson,
  installLayerDependencies,
  isValidTsConfigBuildJson,
  key_njp,
  key_slp,
  key_somod,
  loadAndResolveNamespaces,
  path_build,
  path_functions,
  path_pages,
  path_public,
  path_serverless,
  path_ui,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validatePackageJson,
  validateParametersWithSchema,
  validateServerlessTemplateWithSchema,
  validateUiConfigYaml
} from "@somod/sdk-lib";
import { Command } from "commander";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir,
      key_somod
    ),
    taskRunner(
      `Validate ${file_tsConfigBuildJson}`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react" },
      [path_ui]
    ),
    taskRunner(
      `Validate ${path_ui}/${file_configYaml} with schema`,
      validateUiConfigYaml,
      verbose,
      dir
    ),
    taskRunner(
      `Validate ${path_serverless}/${file_templateYaml} with schema`,
      validateServerlessTemplateWithSchema,
      verbose,
      dir
    ),
    taskRunner(
      `Validate ${file_parametersYaml} with schema`,
      validateParametersWithSchema,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${path_ui}/${path_pages} have default export`,
      doesPagesHaveDefaultExport,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${path_serverless}/${path_functions} have default export`,
      doesServerlessFunctionsHaveDefaultExport,
      verbose,
      dir
    )
  ]);

  await taskRunner(
    `Resolve Namespaces`,
    loadAndResolveNamespaces,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);
  await taskRunner(
    `Build ${path_ui}/${path_public}`,
    buildUiPublic,
    verbose,
    dir
  );

  await taskRunner(
    `Build ${path_ui}/${file_configYaml}`,
    buildUiConfigYaml,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

  await taskRunner(
    `Build ${path_serverless}/${file_templateYaml}`,
    buildServerlessTemplate,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

  await taskRunner(
    `Bundle Serverless Functions`,
    bundleFunctions,
    verbose,
    dir
  );

  await taskRunner(
    `Install libraries of Serverless FunctionLayers`,
    installLayerDependencies,
    verbose,
    dir,
    verbose
  );

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

  await taskRunner(
    `Set ${key_somod} in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    verbose,
    dir,
    key_somod
  );
  await taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir);
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
