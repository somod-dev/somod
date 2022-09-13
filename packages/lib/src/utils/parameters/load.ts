import { readJsonFileStore } from "@solib/cli-base";
import { JSONSchema7, validate } from "@solib/json-validator";
import { Module } from "somod-types";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { readYamlFileStore } from "../yamlFileStore";
import { listAllParameterSchemas } from "./namespace";
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
  const schemaToModuleMap = await listAllParameterSchemas();
  const moduleHandler = ModuleHandler.getModuleHandler();

  const moduleNames = uniq(Object.values(schemaToModuleMap));
  const moduleParameters: Record<string, Parameters> = {};

  await Promise.all(
    moduleNames.map(async moduleName => {
      const moduleNode = await moduleHandler.getModule(moduleName);
      moduleParameters[moduleName] = await loadParameters(moduleNode.module);
    })
  );

  const schemas: JSONSchema7[] = [];
  for (const schemaName in schemaToModuleMap) {
    const moduleName = schemaToModuleMap[schemaName];
    schemas.push(moduleParameters[moduleName].Schemas[schemaName]);
  }
  if (schemas.length > 0) {
    validate({ allOf: schemas }, parameterValues);
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
