import {
  difference,
  isArray,
  isEqual,
  isPlainObject,
  toString,
  union
} from "lodash";
import { normalize, join } from "path";
import { file_tsConfigBuildJson, path_build, path_lib } from "./constants";
import {
  readJsonFileStore,
  updateJsonFileStore,
  ErrorSet,
  unixStylePath
} from "@sodaru/cli-base";

const defaultCompilerOptions = {
  allowUmdGlobalAccess: false,
  outDir: path_build,
  declaration: true,
  target: "ES5",
  module: "ES6",
  rootDir: "./",
  lib: ["ESNext"],
  moduleResolution: "Node",
  esModuleInterop: true,
  importHelpers: true
};

const defaultInclude = [path_lib];

export const validate = async (
  dir: string,
  compilerOptions: Record<string, unknown>,
  include: string[]
): Promise<void> => {
  const tsConfigPath = normalize(join(dir, file_tsConfigBuildJson));
  const unixStyleTsConfigPath = unixStylePath(tsConfigPath);
  const tsConfig = await readJsonFileStore(tsConfigPath);

  const expectedCompilerOptions = {
    ...defaultCompilerOptions,
    ...compilerOptions
  };

  const expectedInclude = [...defaultInclude, ...include];

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
          `include must contain ${missingIncludes.join(
            ", "
          )} in ${unixStyleTsConfigPath}`
        )
      );
    }
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};

export const update = async (
  dir: string,
  compilerOptions: Record<string, unknown>,
  include: string[]
): Promise<void> => {
  const tsConfigPath = normalize(join(dir, file_tsConfigBuildJson));

  type TsConfigType = {
    compilerOptions: Record<string, unknown>;
    include: string[];
  };
  let tsConfig: TsConfigType = null;

  try {
    tsConfig = (await readJsonFileStore(tsConfigPath)) as TsConfigType;
  } catch (e) {
    tsConfig = { compilerOptions: {}, include: [] };
  }

  if (!tsConfig.compilerOptions) {
    tsConfig.compilerOptions = {};
  }

  if (!tsConfig.include) {
    tsConfig.include = [];
  }

  tsConfig.compilerOptions = {
    ...tsConfig.compilerOptions,
    ...defaultCompilerOptions,
    ...compilerOptions
  };

  tsConfig.include = union(tsConfig.include, defaultInclude, include);

  updateJsonFileStore(tsConfigPath, tsConfig);
};
