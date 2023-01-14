import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import { Module } from "somod-types";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  namespace_parameter,
  path_build
} from "../constants";
import { ModuleHandler } from "../module";
import { Parameters, ParameterValues } from "./types";

export const loadParameters = async (module: Module): Promise<Parameters> => {
  try {
    const parameters = await (module.root
      ? readYamlFileStore(join(module.packageLocation, file_parametersYaml))
      : readJsonFileStore(
          join(module.packageLocation, path_build, file_parametersJson)
        ));

    return parameters;
  } catch (e) {
    if (e.message.startsWith("ENOENT: no such file or directory, open")) {
      return {};
    } else {
      throw e;
    }
  }
};

export const validateParameterValues = async (
  parameterValues: ParameterValues
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const parameterToModuleNameMap = (await moduleHandler.getNamespaces())[
    namespace_parameter
  ];

  const moduleNames = uniq(Object.values(parameterToModuleNameMap));
  const moduleParameters: Record<string, Parameters> = {};

  await Promise.all(
    moduleNames.map(async moduleName => {
      const moduleNode = await moduleHandler.getModule(moduleName);
      moduleParameters[moduleName] = await loadParameters(moduleNode.module);
    })
  );

  const parametersSchema: JSONSchema7 = { type: "object", properties: {} };
  for (const parameterName in parameterToModuleNameMap) {
    const moduleName = parameterToModuleNameMap[parameterName];
    parametersSchema.properties[parameterName] =
      moduleParameters[moduleName].parameters[parameterName];
  }
  const violations = await validate(parametersSchema, parameterValues);
  if (violations.length > 0) {
    throw new Error(
      `${file_parametersJson} has following errors\n${violations
        .map(v => " " + (v.path + " " + v.message).trim())
        .join("\n")}`
    );
  }
};

export const loadAllParameterValues = async (
  dir: string
): Promise<ParameterValues> => {
  const parameterValuesPath = join(dir, file_parametersJson);
  const parameterValues = existsSync(parameterValuesPath)
    ? await readJsonFileStore(parameterValuesPath)
    : {};
  await validateParameterValues(parameterValues);
  return parameterValues;
};
