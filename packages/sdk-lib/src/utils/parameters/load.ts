import { readJsonFileStore } from "@solib/cli-base";
import { existsSync } from "fs";
import { join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
import { Module } from "../moduleHandler";
import { readYamlFileStore } from "../yamlFileStore";
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
  dir: string
): Promise<ParameterValues> => {
  const parameterValuesPath = join(dir, file_parametersJson);
  return existsSync(parameterValuesPath)
    ? await readJsonFileStore(parameterValuesPath)
    : {};
};
