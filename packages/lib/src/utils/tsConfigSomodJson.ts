import { difference, isArray, isEqual, isPlainObject, toString } from "lodash";
import { join } from "path";
import {
  file_tsConfigSomodJson,
  path_build,
  path_lib,
  path_serverless,
  path_ui
} from "./constants";
import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import ErrorSet from "./ErrorSet";
import { IContext } from "somod-types";
import { existsSync } from "fs";

const defaultCompilerOptions: Record<string, unknown> = {
  allowUmdGlobalAccess: true,
  outDir: path_build,
  declaration: true,
  target: "ES5",
  module: "ESNext",
  rootDir: "./",
  moduleResolution: "Node",
  esModuleInterop: true,
  importHelpers: true,
  skipLibCheck: true
};

export const validate = async (context: IContext): Promise<void> => {
  const tsConfigPath = join(context.dir, file_tsConfigSomodJson);
  const unixStyleTsConfigPath = unixStylePath(tsConfigPath);
  const tsConfig = await readJsonFileStore(tsConfigPath);

  const expectedCompilerOptions = {
    ...defaultCompilerOptions
  };

  const expectedInclude = [];

  if (existsSync(join(context.dir, path_lib))) {
    expectedInclude.push(path_lib);
  }

  if (context.isUI && existsSync(join(context.dir, path_ui))) {
    expectedCompilerOptions.jsx = "react-jsx";
    expectedInclude.push(path_ui);
  }
  if (context.isServerless && existsSync(join(context.dir, path_serverless))) {
    expectedInclude.push(path_serverless);
  }

  const errors: Error[] = [];

  if (!isPlainObject(tsConfig.compilerOptions)) {
    errors.push(
      new Error(`compilerOptions must be object in ${unixStyleTsConfigPath}`)
    );
  } else {
    Object.keys(expectedCompilerOptions).forEach(compilerOption => {
      if (
        !isEqual(
          expectedCompilerOptions[compilerOption],
          tsConfig.compilerOptions[compilerOption]
        )
      ) {
        errors.push(
          new Error(
            `compilerOptions.${compilerOption} must be '${toString(
              expectedCompilerOptions[compilerOption]
            )}' in ${unixStyleTsConfigPath}`
          )
        );
      }
    });
  }

  if (!isArray(tsConfig.include)) {
    errors.push(new Error(`include must be array in ${unixStyleTsConfigPath}`));
  } else {
    const missingIncludes = difference(expectedInclude, tsConfig.include);
    if (missingIncludes.length > 0) {
      errors.push(
        new Error(
          `include must contain ${missingIncludes
            .map(i => `'${i}'`)
            .join(", ")} in ${unixStyleTsConfigPath}`
        )
      );
    }
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
