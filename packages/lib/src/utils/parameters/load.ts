import { existsSync } from "fs";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import { IContext, Module } from "somod-types";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
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

export const loadAllParameterValues = async (
  context: IContext
): Promise<ParameterValues> => {
  const parameterValuesPath = join(context.dir, file_parametersJson);
  const parameterValues = existsSync(parameterValuesPath)
    ? await readJsonFileStore(parameterValuesPath)
    : {};
  return parameterValues;
};
