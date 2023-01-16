import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import { IContext, Module } from "somod-types";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
import { Parameters, ParameterValues } from "./types";
import { getParameterToModuleMap } from "./namespace";

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
  context: IContext,
  parameterValues: ParameterValues
) => {
  const parameterToModuleNameMap = getParameterToModuleMap(context);

  const moduleNames = uniq(Object.values(parameterToModuleNameMap));
  const moduleParameters: Record<string, Parameters> = {};

  await Promise.all(
    moduleNames.map(async moduleName => {
      const moduleNode = context.moduleHandler.getModule(moduleName);
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
  context: IContext
): Promise<ParameterValues> => {
  const parameterValuesPath = join(context.dir, file_parametersJson);
  const parameterValues = existsSync(parameterValuesPath)
    ? await readJsonFileStore(parameterValuesPath)
    : {};
  await validateParameterValues(context, parameterValues);
  return parameterValues;
};
