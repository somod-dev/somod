import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import {
  buildServerlessTemplate,
  buildUiPublic,
  bundleFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesServerlessFunctionsHaveDefaultExport,
  file_index_js,
  file_packageJson,
  file_pageIndex_js,
  file_templateJson,
  file_templateYaml,
  file_tsConfigBuildJson,
  generateIndex,
  generatePageIndex,
  installLayerDependencies,
  isValidTsConfigBuildJson,
  key_njp,
  key_slp,
  key_somod,
  path_build,
  path_functions,
  path_public,
  path_serverless,
  path_ui,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validateDependencyModules,
  validatePackageJson,
  validateServerlessTemplateWithSchema
} from "@somod/sdk-lib";
import { Command, Option } from "commander";

type BuildActions = CommonOptions & {
  type: "all" | "njp" | "slp";
};

export const BuildAction = async ({
  verbose,
  type
}: BuildActions): Promise<void> => {
  const dir = process.cwd();

  const typescriptIncludePaths: string[] = [];
  const moduleIndicators: string[] = [key_somod];
  if (type == "all" || type == "njp") {
    typescriptIncludePaths.push(path_ui);
    moduleIndicators.push(key_njp);
  }
  if (type == "all" || type == "slp") {
    // /serverless/functions use esbuild to bundle
    //typescriptIncludePaths.push(path_serverless);
    moduleIndicators.push(key_slp);
  }

  const validations: Promise<unknown>[] = [
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir,
      key_somod
    ),
    taskRunner(
      `Check if ${file_tsConfigBuildJson} is valid`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react" },
      typescriptIncludePaths
    ),
    taskRunner(
      `Validate module dependency`,
      validateDependencyModules,
      verbose,
      dir,
      moduleIndicators
    )
  ];

  if (type == "all" || type == "slp") {
    validations.push(
      taskRunner(
        `Check if ${path_serverless}/${path_functions} have default export`,
        doesServerlessFunctionsHaveDefaultExport,
        verbose,
        dir
      )
    );
  }

  await Promise.all(validations);

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);

  const njpBuildTasks = async () => {
    await taskRunner(
      `Build ${path_build}/${path_ui}/${path_public}`,
      buildUiPublic,
      verbose,
      dir
    );
    await taskRunner(
      `Generate ${path_build}/${path_ui}/${file_pageIndex_js}`,
      generatePageIndex,
      verbose,
      dir
    );
  };
  const slpBuildTasks = async () => {
    await taskRunner(
      `validate ${path_serverless}/${file_templateYaml}`,
      validateServerlessTemplateWithSchema,
      verbose,
      dir
    );
    await taskRunner(
      `Generate ${path_build}/${path_serverless}/${file_templateJson}`,
      buildServerlessTemplate,
      verbose,
      dir,
      moduleIndicators
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
  };

  const buildTasks: Promise<unknown>[] = [];

  if (type == "all" || type == "njp") {
    buildTasks.push(njpBuildTasks());
  }
  if (type == "all" || type == "slp") {
    buildTasks.push(slpBuildTasks());
  }

  await Promise.all(buildTasks);

  await taskRunner(
    `Generate ${path_build}/${file_index_js}`,
    generateIndex,
    verbose,
    dir,
    [
      `${path_ui}/${file_pageIndex_js.substring(
        0,
        file_pageIndex_js.lastIndexOf(".js")
      )}`
    ]
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

buildCommand.addOption(
  new Option("-t, --type [type]", "Type of modules to build")
    .choices(["all", "njp", "slp"])
    .default("all")
);

buildCommand.action(BuildAction);

export default buildCommand;
