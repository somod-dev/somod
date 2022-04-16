import { createHash } from "crypto";
import { cloneDeep, isArray, isPlainObject, isUndefined } from "lodash";
import { KeywordAll, SLPKeyword, SLPTemplate } from "./types";

const getSLPKeywordPaths = (chunk: unknown): SLPTemplate["keywordPaths"] => {
  const keywordPaths = Object.fromEntries(
    KeywordAll.map(keyword => [keyword, []])
  ) as SLPTemplate["keywordPaths"];

  if (isPlainObject(chunk)) {
    KeywordAll.forEach(keyword => {
      if (!isUndefined(chunk[keyword])) {
        keywordPaths[keyword].push([]);
      }
    });

    Object.keys(chunk).forEach(key => {
      const childKeywordPaths = getSLPKeywordPaths(chunk[key]);
      KeywordAll.forEach(keyword => {
        childKeywordPaths[keyword].forEach((_keywordPaths: string[]) => {
          _keywordPaths.unshift(key);
          keywordPaths[keyword].push(_keywordPaths);
        });
      });
    });
  } else if (isArray(chunk)) {
    chunk.forEach((arrayItem, index) => {
      const childKeywordPaths = getSLPKeywordPaths(arrayItem);
      KeywordAll.forEach(keyword => {
        childKeywordPaths[keyword].forEach((_keywordPaths: string[]) => {
          _keywordPaths.unshift(index + "");
          keywordPaths[keyword].push(_keywordPaths);
        });
      });
    });
  }
  return keywordPaths;
};

export const updateKeywordPathsInSLPTemplate = (
  slpTemplate: SLPTemplate
): void => {
  const slpKeywords = getSLPKeywordPaths(slpTemplate.original.Resources);
  slpTemplate.keywordPaths = slpKeywords;
};

/**
 * returns the value present in the path (usually Keywords path), and it always looks in original
 * @param slpTemplate : single slp tamplate
 * @param path : json path in array format (usually Keywords path)
 * @returns value found inside the json path
 *          for example : { "SLP::Ref": { module:"@sodaru/slp", "resource": "BaseRestApi" } }
 */
export const getSLPKeyword = <T extends SLPKeyword>(
  slpTemplate: SLPTemplate,
  path: string[]
): T => {
  // always return the keyword value from original
  let keyword: unknown = slpTemplate.original.Resources;

  path.forEach(pathSegment => {
    keyword = keyword[pathSegment];
  });
  return cloneDeep(keyword) as T;
};

export const replaceSLPKeyword = (
  slpTemplate: SLPTemplate,
  path: string[],
  newValue: unknown
): void => {
  let keyword: unknown = slpTemplate.Resources;
  const _path = [...path];
  const lastPathSegment = _path.pop();
  _path.forEach(pathSegment => {
    keyword = keyword[pathSegment];
  });
  keyword[lastPathSegment] = newValue;
};

const hashModuleName = (str: string): string => {
  return createHash("sha256").update(str).digest("hex").substring(0, 8);
};

export const getSAMParameterName = (
  moduleName: string,
  slpParameterName: string
): string => {
  return "p" + hashModuleName(moduleName) + slpParameterName;
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
