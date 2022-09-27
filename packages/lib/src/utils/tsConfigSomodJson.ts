import { difference, isArray, isEqual, isPlainObject, toString } from "lodash";
import { normalize, join } from "path";
import { file_tsConfigSomodJson, path_build, path_lib } from "./constants";
import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import ErrorSet from "./ErrorSet";

const defaultCompilerOptions = {
  allowUmdGlobalAccess: true,
  outDir: path_build,
  declaration: true,
  target: "ES5",
  module: "ES6",
  rootDir: "./",
  lib: ["ESNext", "DOM", "DOM.Iterable"],
  moduleResolution: "Node",
  esModuleInterop: true,
  importHelpers: true,
  skipLibCheck: true
};

const defaultInclude = [path_lib];

export const validate = async (
  dir: string,
  compilerOptions: Record<string, unknown>,
  include: string[]
): Promise<void> => {
  const tsConfigPath = normalize(join(dir, file_tsConfigSomodJson));
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
      let error = false;
      if (compilerOption == "lib") {
        if (
          difference(
            expectedCompilerOptions[compilerOption],
            tsConfig.compilerOptions[compilerOption]
          ).length > 0
        ) {
          error = true;
        }
      } else if (
        !isEqual(
          expectedCompilerOptions[compilerOption],
          tsConfig.compilerOptions[compilerOption]
        )
      ) {
        error = true;
      }
      if (error) {
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
