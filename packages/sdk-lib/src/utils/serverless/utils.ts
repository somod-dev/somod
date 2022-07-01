import { createHash } from "crypto";
import { getKeyword, getKeywordPaths, replaceKeyword } from "../keywords";
import { KeywordAll, SLPKeyword, SLPTemplate } from "./types";

export const updateKeywordPathsInSLPTemplate = (
  slpTemplate: SLPTemplate
): void => {
  const slpKeywords = getKeywordPaths(
    slpTemplate.original.Resources,
    KeywordAll
  );
  slpTemplate.keywordPaths = slpKeywords;
};

export const getSLPKeyword = <T extends SLPKeyword>(
  slpTemplate: SLPTemplate,
  path: string[]
): T => {
  // always return the keyword value from original
  return getKeyword(slpTemplate.original.Resources, path) as T;
};

export const replaceSLPKeyword = (
  slpTemplate: SLPTemplate,
  path: string[],
  newValue: unknown
): void => {
  replaceKeyword(slpTemplate.Resources, path, newValue);
};

const hashModuleName = (str: string): string => {
  return createHash("sha256").update(str).digest("hex").substring(0, 8);
};

export const getParameterSpaceResourceLogicalId = (
  parameterSpace: string
): string => {
  return "p" + parameterSpace;
};

export const getSAMResourceLogicalId = (
  moduleName: string,
  slpResourceId: string
): string => {
  return "r" + hashModuleName(moduleName) + slpResourceId;
};

export const getSAMResourceName = (
  moduleName: string,
  slpResourceName: string
): unknown => {
  return {
    "Fn::Sub": [
      "slp${stackId}${moduleHash}${slpResourceName}",
      {
        stackId: {
          "Fn::Select": [2, { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }]
        },
        moduleHash: hashModuleName(moduleName),
        slpResourceName
      }
    ]
  };
};
