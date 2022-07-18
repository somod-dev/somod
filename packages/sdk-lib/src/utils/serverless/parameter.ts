import { readJsonFileStore } from "@solib/cli-base";
import { uniq } from "lodash";
import { join } from "path";
import { file_parametersJson } from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { loadServerlessTemplate } from "./slpTemplate";
import {
  KeywordSOMODParameter,
  ServerlessTemplate,
  SOMODParameter
} from "./types";
import { getSOMODKeyword } from "./utils";

export const separateParameterSpace = (
  param: string
): { parameterSpace: string; param: string } => {
  const [parameterSpace, ...rest] = param.split(".");
  return {
    parameterSpace,
    param: rest.join(".")
  };
};

export const combineParameterSpace = (
  parameterSpace: string,
  param: string
): string => {
  return `${parameterSpace}.${param}`;
};

/**
 * Returns all referenced SOMOD::Parameter names grouped by 1st level parameterSpace
 */
export const listAllSomodParameters = (
  serverlessTemplate: ServerlessTemplate
): Record<string, string[]> => {
  const parameters: string[] = [];

  Object.values(serverlessTemplate).forEach(slpTemplate => {
    const slpParameterPaths = slpTemplate.keywordPaths[KeywordSOMODParameter];
    slpParameterPaths.forEach(slpParameterPath => {
      const parameter = getSOMODKeyword<SOMODParameter>(
        slpTemplate,
        slpParameterPath
      )[KeywordSOMODParameter];
      parameters.push(parameter);
    });
  });

  const allParams = uniq(parameters);

  const slpParameters: Record<string, string[]> = {};

  allParams.map(p => {
    const { parameterSpace, param } = separateParameterSpace(p);
    if (!slpParameters[parameterSpace]) {
      slpParameters[parameterSpace] = [];
    }
    slpParameters[parameterSpace].push(param);

    return parameterSpace;
  });

  return slpParameters;
};

export const generateSamConfigParameterOverrides = async (dir: string) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  const allModules = await moduleHandler.listModules();

  const serverlessTemplate = await loadServerlessTemplate(allModules);

  const slpParameters = listAllSomodParameters(serverlessTemplate);

  const parameterValues = await readJsonFileStore(
    join(dir, file_parametersJson)
  );

  const parameterOverrides: Record<string, string> = {};

  Object.keys(slpParameters).forEach(parameterSpace => {
    const parameterSpaceValues = Object.fromEntries(
      slpParameters[parameterSpace].map(param => [
        param,
        parameterValues[combineParameterSpace(parameterSpace, param)]
      ])
    );

    parameterOverrides[parameterSpace] = JSON.stringify(parameterSpaceValues);
  });

  return parameterOverrides;
};
