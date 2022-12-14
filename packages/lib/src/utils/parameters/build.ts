import { ModuleNode } from "somod-types";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { readYamlFileStore } from "nodejs-file-utils";
import { loadParameters } from "./load";

const buildParametersYaml = async (dir: string): Promise<void> => {
  const parameters = await readYamlFileStore(join(dir, file_parametersYaml));
  const parametersBuildPath = join(dir, path_build, file_parametersJson);
  await mkdir(dirname(parametersBuildPath), { recursive: true });
  await writeFile(parametersBuildPath, JSON.stringify(parameters));
};

const validate = async (moduleNode: ModuleNode): Promise<void> => {
  const parameters = await loadParameters(moduleNode.module);

  const parametersWithLongName = Object.keys(
    parameters.Parameters || {}
  ).filter(parameterName => parameterName.length > 128);

  if (parametersWithLongName.length > 0) {
    throw new Error(
      `Following parameters have too long name (maximum 128 characters are allowed)\n${parametersWithLongName
        .map(p => " - " + p)
        .join("\n")}`
    );
  }
};

export const build = async (dir: string): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const rootModuleNode = await moduleHandler.getRoodModuleNode();

  await validate(rootModuleNode);

  await buildParametersYaml(dir);
};
