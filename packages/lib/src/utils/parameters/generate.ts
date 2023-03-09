import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import { file_parametersJson } from "../constants";
import { loadParameters } from "./load";
import { Parameters } from "./types";
import { IContext } from "somod-types";
import { getParameterToModuleMap } from "./namespace";

/**
 * Creates/Updates `parameters.json` at the root of the project directory.
 * `parameters.json` contains map of parameter name to default value of the parameter
 *
 * if **`oveerride`** is **true** all the existing values in parameters.json are overrided by default value, otherwise only new parameters are added to `parameters.json` if any
 */
export const generate = async (
  context: IContext,
  override = false
): Promise<void> => {
  const parameterToModuleNameMap = getParameterToModuleMap(context);

  const allModuleNames = uniq(Object.values(parameterToModuleNameMap));

  const moduleToParametersMap: Record<string, Parameters> = {};

  await Promise.all(
    allModuleNames.map(async moduleName => {
      const moduleNode = context.moduleHandler.getModule(moduleName);
      moduleToParametersMap[moduleName] = await loadParameters(
        moduleNode.module
      );
    })
  );

  const parameterDefaultValues: Record<string, unknown> = {};
  Object.keys(parameterToModuleNameMap).map(parameterName => {
    let defaultValue =
      moduleToParametersMap[parameterToModuleNameMap[parameterName]].parameters[
        parameterName
      ].default;

    if (defaultValue === undefined) {
      defaultValue = null;
    }
    parameterDefaultValues[parameterName] = defaultValue;
  });

  const rootParametersJsonPath = join(context.dir, file_parametersJson);
  const existingParameters = existsSync(rootParametersJsonPath)
    ? await readJsonFileStore(rootParametersJsonPath)
    : {};

  const newParameters = override
    ? { ...existingParameters, ...parameterDefaultValues }
    : { ...parameterDefaultValues, ...existingParameters };

  updateJsonFileStore(rootParametersJsonPath, newParameters);
  await saveJsonFileStore(rootParametersJsonPath);
};
