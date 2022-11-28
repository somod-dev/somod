import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { existsSync } from "fs";
import { uniq } from "lodash";
import { join } from "path";
import { file_parametersJson, namespace_parameter } from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { loadParameters } from "./load";
import { Parameters } from "./types";

/**
 * Creates/Updates `parameters.json` at the root of the project directory.
 * `parameters.json` contains map of parameter name to default value of the parameter
 *
 * if **`oveerride`** is **true** all the existing values in parameters.json are overrided by default value, otherwise only new parameters are added to `parameters.json` if any
 */
export const generate = async (
  dir: string,
  override = false
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const namespaces = await moduleHandler.getNamespaces();

  const parameterToModuleNameMap = namespaces[namespace_parameter];

  const allModuleNames = uniq(Object.values(parameterToModuleNameMap));

  const moduleToParametersMap: Record<string, Parameters> = {};

  await Promise.all(
    allModuleNames.map(async moduleName => {
      const moduleNode = await moduleHandler.getModule(moduleName);
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

  const rootParametersJsonPath = join(dir, file_parametersJson);
  const existingParameters = existsSync(rootParametersJsonPath)
    ? await readJsonFileStore(rootParametersJsonPath)
    : {};

  const newParameters = override
    ? { ...existingParameters, ...parameterDefaultValues }
    : { ...parameterDefaultValues, ...existingParameters };

  updateJsonFileStore(rootParametersJsonPath, newParameters);
  await saveJsonFileStore(rootParametersJsonPath);
};
