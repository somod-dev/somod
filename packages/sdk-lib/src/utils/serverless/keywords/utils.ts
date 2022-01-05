import { cloneDeep, isArray, isPlainObject, isUndefined } from "lodash";
import {
  KeywordAll,
  KeywordSLPDependsOn,
  KeywordSLPFunction,
  KeywordSLPRef,
  KeywordSLPRefParameter,
  KeywordSLPRefResourceName,
  SLPDependsOn,
  SLPFunction,
  SLPKeyword,
  SLPRef,
  SLPRefParameter,
  SLPRefResourceName,
  SLPTemplate
} from "../types";

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
  const slpKeywords = getSLPKeywordPaths(slpTemplate.Resources);
  slpTemplate.keywordPaths = slpKeywords;
};

export const getSLPKeyword = <T extends SLPKeyword>(
  slpTemplate: SLPTemplate,
  paths: string[]
): T => {
  let keyword: unknown = slpTemplate.Resources;
  paths.forEach(path => {
    keyword = keyword[path];
  });
  return cloneDeep(keyword) as T;
};

export const replaceSLPKeyword = (
  slpTemplate: SLPTemplate,
  paths: string[],
  newValue: unknown
): void => {
  let keyword: unknown = slpTemplate.Resources;
  const _paths = [...paths];
  const lastPath = _paths.pop();
  _paths.forEach(path => {
    keyword = keyword[path];
  });
  keyword[lastPath] = newValue;
};

/**
 * some of the slp keywords references the modulename , by default the module name is the current module of the SLP Template
 * fill the default value of modulename
 */
export const updateCurrentModuleInSLPTemplate = (
  module: string,
  slpTemplate: SLPTemplate
): void => {
  type TypeKeywordsToUpdate =
    | typeof KeywordSLPDependsOn
    | typeof KeywordSLPRef
    | typeof KeywordSLPRefParameter
    | typeof KeywordSLPRefResourceName
    | typeof KeywordSLPFunction;

  const keywordsToUpdate: TypeKeywordsToUpdate[] = [
    KeywordSLPDependsOn,
    KeywordSLPRef,
    KeywordSLPRefParameter,
    KeywordSLPRefResourceName,
    KeywordSLPFunction
  ];

  keywordsToUpdate.forEach(keyword => {
    slpTemplate.keywordPaths[keyword].forEach(keywordPaths => {
      const keywordValue = getSLPKeyword<
        | SLPDependsOn
        | SLPRef
        | SLPRefParameter
        | SLPRefResourceName
        | SLPFunction
      >(slpTemplate, keywordPaths);
      if (keyword == KeywordSLPFunction) {
        keywordValue[keyword] = {
          module,
          function: keywordValue[keyword]
        };
      } else if (keywordValue[keyword].module === undefined) {
        keywordValue[keyword].module = module;
      }
      replaceSLPKeyword(slpTemplate, keywordPaths, keywordValue);
    });
  });
};
