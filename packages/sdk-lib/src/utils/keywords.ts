import { cloneDeep, isArray, isPlainObject, isUndefined } from "lodash";

export const getKeywordPaths = <T extends string>(
  json: unknown,
  KeywordAll: T[]
): Record<T, string[][]> => {
  const keywordPaths = Object.fromEntries(
    KeywordAll.map(keyword => [keyword, []])
  ) as Record<T, string[][]>;

  if (isPlainObject(json)) {
    KeywordAll.forEach(keyword => {
      if (!isUndefined(json[keyword])) {
        keywordPaths[keyword].push([]);
      }
    });

    Object.keys(json).forEach(key => {
      const childKeywordPaths = getKeywordPaths(json[key], KeywordAll);
      KeywordAll.forEach(keyword => {
        childKeywordPaths[keyword].forEach((_keywordPaths: string[]) => {
          _keywordPaths.unshift(key);
          keywordPaths[keyword].push(_keywordPaths);
        });
      });
    });
  } else if (isArray(json)) {
    json.forEach((arrayItem, index) => {
      const childKeywordPaths = getKeywordPaths(arrayItem, KeywordAll);
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

export const getKeyword = (json: unknown, path: string[]): unknown => {
  let keyword: unknown = json;

  path.forEach(pathSegment => {
    keyword = keyword[pathSegment];
  });
  return cloneDeep(keyword);
};

export const replaceKeyword = (
  json: unknown,
  path: string[],
  newValue: unknown
): void => {
  let keyword: unknown = json;
  const _path = [...path];
  const lastPathSegment = _path.pop();
  _path.forEach(pathSegment => {
    keyword = keyword[pathSegment];
  });
  keyword[lastPathSegment] = newValue;
};
