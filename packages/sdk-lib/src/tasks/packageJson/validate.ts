import { JSONSchema7 } from "json-schema";
import {
  cli_version_regex,
  file_index_dts,
  file_index_js,
  key_files,
  key_jsnextMain,
  key_main,
  key_module,
  key_njp,
  key_sideEffects,
  key_slp,
  key_somod,
  key_type,
  key_typings,
  ModuleType,
  path_build,
  path_lib
} from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";
import { validate as validateJson } from "@solib/json-validator";
import { DataValidationError, DataViolation } from "@solib/errors";

const packageJsonSchema: JSONSchema7 = {
  type: "object",
  required: [
    "name",
    "version",
    "description",
    key_module,
    key_typings,
    key_files,
    key_sideEffects
  ],
  oneOf: [
    { type: "object", required: [key_njp] },
    { type: "object", required: [key_slp] },
    { type: "object", required: [key_somod] }
  ],
  properties: {
    name: {
      // TODO: import pattern from common-types-schemas
      type: "string"
    },
    version: {
      type: "string"
    },
    description: {
      type: "string"
    },
    [key_module]: {
      const: `${path_build}/${path_lib}/${file_index_js}`,
      errorMessage: `must be ${path_build}/${path_lib}/${file_index_js}`
    },
    [key_typings]: {
      const: `${path_build}/${path_lib}/${file_index_dts}`,
      errorMessage: `must be ${path_build}/${path_lib}/${file_index_dts}`
    },
    [key_files]: {
      type: "array",
      items: { type: "string" },
      contains: {
        const: `${path_build}`
      },
      errorMessage: {
        contains: `must contain ${path_build}`
      }
    },
    [key_sideEffects]: {
      const: false,
      errorMessage: {
        const: "must be false"
      }
    },
    [key_njp]: {
      type: "string",
      pattern: cli_version_regex.source
    },
    [key_slp]: {
      type: "string",
      pattern: cli_version_regex.source
    },
    [key_somod]: {
      type: "string",
      pattern: cli_version_regex.source
    }
  },
  errorMessage: {
    oneOf: `exactly one of ${key_njp}, ${key_slp}, ${key_somod} must be present`
  }
};

const validateSodaruModuleKey = (
  packageJson: Record<string, unknown>,
  type: ModuleType
) => {
  const violations: DataViolation[] = [];
  if (packageJson[key_njp] !== undefined && type != "njp") {
    violations.push({ path: key_njp, message: "must not exist" });
  }
  if (packageJson[key_slp] !== undefined && type != "slp") {
    violations.push({ path: key_slp, message: "must not exist" });
  }
  if (packageJson[key_somod] !== undefined && type != "somod") {
    violations.push({ path: key_somod, message: "must not exist" });
  }

  if (violations.length > 0) {
    throw new DataValidationError(violations);
  }
};

const validateInvalidKeys = (packageJson: Record<string, unknown>) => {
  const invalidKeys = [key_main, key_jsnextMain, key_type];

  const violations: DataViolation[] = [];
  invalidKeys.forEach(key => {
    if (packageJson[key] !== undefined) {
      violations.push({ path: key, message: "must not exist" });
    }
  });

  if (violations.length > 0) {
    throw new DataValidationError(violations);
  }
};

export const validate = async (
  dir: string,
  type: ModuleType
): Promise<void> => {
  const packageJson = await read(dir);

  try {
    validateJson(packageJsonSchema, packageJson);
    validateInvalidKeys(packageJson);
    validateSodaruModuleKey(packageJson, type);
  } catch (e) {
    if (e instanceof DataValidationError) {
      throw new Error(
        `${packageJsonPath(dir)} has following errors\n${e.violations
          .map(v => " " + (v.path + " " + v.message).trim())
          .join("\n")}`
      );
    } else {
      throw e;
    }
  }
};
