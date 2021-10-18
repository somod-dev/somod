import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  buildFunctionLayers,
  buildServerlessTemplate,
  buildUiPublic,
  bundleRootServerlessFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesAwsSdkIsRightVersionInPackageJson,
  doesEmpIsTrueInPackageJson,
  doesFilesHasBuildInPackageJson,
  doesJsnextMainNotSetInPackageJson,
  doesModuleIsBuildIndexInPackageJson,
  doesServerlessFunctionsHaveDefaultExport,
  doesSideEffectsIsFalseInPackageJson,
  doesTypeIsNotSetInPackageJson,
  doesTypingsIsBuildIndexInPackageJson,
  file_functionIndex_js,
  file_index_dts,
  file_index_js,
  file_packageJson,
  file_pageIndex_js,
  file_templateJson,
  file_templateYaml,
  file_tsConfigBuildJson,
  generateFunctionIndex,
  generateIndex,
  generatePageIndex,
  isValidTsConfigBuildJson,
  key_emp,
  key_files,
  key_jsnextMain,
  key_module,
  key_moduleAwsSdk,
  key_njp,
  key_sideEffects,
  key_slp,
  key_type,
  key_typings,
  path_build,
  path_functions,
  path_public,
  path_serverless,
  path_ui,
  validateModuleDependency,
  validateServerlessTemplateWithSchema
} from "@sodaru-cli/package-manager-lib";
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
  const moduleIndicators: string[] = [key_emp];
  if (type == "all" || type == "njp") {
    typescriptIncludePaths.push(path_ui);
    moduleIndicators.push(key_njp);
  }
  if (type == "all" || type == "slp") {
    typescriptIncludePaths.push(path_serverless);
    moduleIndicators.push(key_slp);
  }

  const validations: Promise<unknown>[] = [
    taskRunner(
      `Check if ${key_emp} is true in ${file_packageJson}`,
      doesEmpIsTrueInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_module} is '${path_build}/${file_index_js}' in ${file_packageJson}`,
      doesModuleIsBuildIndexInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_typings} is '${path_build}/${file_index_dts}' in ${file_packageJson}`,
      doesTypingsIsBuildIndexInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_sideEffects} is false in ${file_packageJson}`,
      doesSideEffectsIsFalseInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_type} is not set in ${file_packageJson}`,
      doesTypeIsNotSetInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_jsnextMain} is not set in ${file_packageJson}`,
      doesJsnextMainNotSetInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_files} include ${path_build} in ${file_packageJson}`,
      doesFilesHasBuildInPackageJson,
      verbose,
      dir
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
      validateModuleDependency,
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
      ),
      taskRunner(
        `Check if ${key_moduleAwsSdk} has right version in ${file_packageJson}`,
        doesAwsSdkIsRightVersionInPackageJson,
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
      `Bundle root module functions`,
      bundleRootServerlessFunctions,
      verbose,
      dir
    );
    await taskRunner(`Copy Layers to build`, buildFunctionLayers, verbose, dir);
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
      `Generate ${path_build}/${path_serverless}/${file_functionIndex_js}`,
      generateFunctionIndex,
      verbose,
      dir
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
      )}`,
      `${path_serverless}/${file_functionIndex_js.substring(
        0,
        file_functionIndex_js.lastIndexOf(".js")
      )}`
    ]
  );
};

const buildCommand = new Command("build");

buildCommand.addOption(
  new Option("-t, --type [type]", "Type of modules to build")
    .choices(["all", "njp", "slp"])
    .default("all")
);

buildCommand.action(BuildAction);

export default buildCommand;
