import { readJsonFileStore } from "@solib/cli-base";
import { uniq } from "lodash";
import { join } from "path";
import { file_parametersJson } from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { loadServerlessTemplate } from "./slpTemplate";
import { KeywordSLPParameter, ServerlessTemplate, SLPParameter } from "./types";
import { getSLPKeyword } from "./utils";

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

export const serialize = (parameterValues: Record<string, unknown>): string => {
  return JSON.stringify(parameterValues);
};

export const deserialize = (
  strParameterValues: string
): Record<string, unknown> => {
  return JSON.parse(strParameterValues);
};

/**
 * Returns all referenced SLP::Parameter names grouped by 1st level parameterSpace
 */
export const listAllSlpParameters = (
  serverlessTemplate: ServerlessTemplate
): Record<string, string[]> => {
  const parameters: string[] = [];

  Object.values(serverlessTemplate).forEach(slpTemplate => {
    const slpParameterPaths = slpTemplate.keywordPaths[KeywordSLPParameter];
    slpParameterPaths.forEach(slpParameterPath => {
      const parameter = getSLPKeyword<SLPParameter>(
        slpTemplate,
        slpParameterPath
      )[KeywordSLPParameter];
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

export const generateSamConfigParameterOverrides = async (
  dir: string,
  moduleIndicators: string[]
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const allModules = await moduleHandler.listModules();

  const serverlessTemplate = await loadServerlessTemplate(allModules);

  const slpParameters = listAllSlpParameters(serverlessTemplate);

  const parameterValues = await readJsonFileStore(
    join(dir, file_parametersJson)
  );

  const parameterOverrides: Record<string, string> = {};

  Object.keys(slpParameters).forEach(parameterSpace => {
    const parameterSpaceValues = slpParameters[parameterSpace].map(param => [
      param,
      parameterValues[combineParameterSpace(parameterSpace, param)]
    ]);

    const strParameterSpaceValue = JSON.stringify(
      JSON.stringify(JSON.stringify(parameterSpaceValues))
    );

    parameterOverrides[parameterSpace] = strParameterSpaceValue.substring(
      1,
      strParameterSpaceValue.length - 1
    );
  });

  return parameterOverrides;
};
