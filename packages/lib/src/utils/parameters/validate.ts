import { JSONSchema7, validate } from "decorated-ajv";
import { uniq } from "lodash";
import { IContext } from "somod-types";
import { file_parametersJson } from "../constants";
import { loadParameters } from "./load";
import { getParameterToModuleMap } from "./namespace";
import { Parameters, ParameterValues } from "./types";

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
