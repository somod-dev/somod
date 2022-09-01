import { readJsonFileStore } from "@solib/cli-base";
import { JSONSchema7, validate } from "@solib/json-validator";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
import { Module, ModuleHandler } from "../moduleHandler";
import { readYamlFileStore } from "../yamlFileStore";
import { Filter } from "./filters";
import { listAllParameters, listAllParameterSchemas } from "./namespace";
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

export const applyFiltersToParameterValues = async (
  parameterValues: ParameterValues
) => {
  const parameterToModuleMap = await listAllParameters();
  const moduleHandler = ModuleHandler.getModuleHandler();

  const moduleNames = uniq(Object.values(parameterToModuleMap));
  const moduleParameters: Record<string, Parameters> = {};

  await Promise.all(
    moduleNames.map(async moduleName => {
      const moduleNode = await moduleHandler.getModule(moduleName);
      moduleParameters[moduleName] = await loadParameters(moduleNode.module);
    })
  );

  const parameterFilters: Record<string, string[]> = {};
  for (const parameterName in parameterToModuleMap) {
    const moduleName = parameterToModuleMap[parameterName];
    let filters = [];
    if (moduleParameters[moduleName].Filters) {
      filters = moduleParameters[moduleName].Filters[parameterName] || [];
    }
    if (filters.length > 0) {
      parameterFilters[parameterName] = filters;
    }
  }

  const filter = Filter.getFilter();

  await Promise.all(
    Object.keys(parameterFilters).map(async parameterName => {
      const filteredValue = await filter.apply(
        parameterValues[parameterName],
        parameterFilters[parameterName]
      );
      parameterValues[parameterName] = filteredValue;
    })
  );
};

export const loadAllParameterValues = async (
  dir: string
): Promise<ParameterValues> => {
  const parameterValuesPath = join(dir, file_parametersJson);
  const parameterValues = existsSync(parameterValuesPath)
    ? await readJsonFileStore(parameterValuesPath)
    : {};
  await validateParameterValues(parameterValues);
  await applyFiltersToParameterValues(parameterValues);
  return parameterValues;
};
