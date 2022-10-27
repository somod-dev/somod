import {
  intersection,
  isArray,
  isBoolean,
  isNull,
  isNumber,
  isPlainObject,
  isString
} from "lodash";
import {
  JSONType,
  JSONNode,
  JSONObjectType,
  KeywordValidator,
  KeywordProcessor,
  KeywordReplacement,
  KeywordObjectReplacement,
  KeywordKeywordReplacement
} from "somod-types";

export const parseJson = (json: JSONType): JSONNode => {
  const navigator = (json: JSONType, parent?: JSONNode["parent"]): JSONNode => {
    if (isArray(json)) {
      const itemNodes: JSONNode[] = [];
      const thisNode: JSONNode = {
        type: "array",
        items: itemNodes,
        parent: parent
      };
      Object.freeze(thisNode);
      json.forEach((item, i) => {
        const itemNode = navigator(item, {
          key: i,
          node: thisNode
        });
        itemNodes.push(itemNode);
      });
      Object.freeze(itemNodes);
      return thisNode;
    } else if (isPlainObject(json)) {
      const propertyNodes: Record<string, JSONNode> = {};
      const thisNode: JSONNode = {
        type: "object",
        properties: propertyNodes,
        parent: parent
      };
      Object.freeze(thisNode);
      Object.keys(json).forEach(property => {
        const propertyNode = navigator(json[property], {
          key: property,
          node: thisNode
        });
        propertyNodes[property] = propertyNode;
      });
      Object.freeze(propertyNodes);
      return thisNode;
    } else if (
      isString(json) ||
      isBoolean(json) ||
      isNumber(json) ||
      isNull(json)
    ) {
      const thisNode: JSONNode = {
        type: "primitive",
        value: json,
        parent: parent
      };
      Object.freeze(thisNode);
      return thisNode;
    } else {
      throw new Error(`Unknown type ${json} ${parent}`);
    }
  };
  return navigator(json);
};

export const getPath = (jsonNode: JSONNode): (string | number)[] => {
  const path: (string | number)[] = [];
  let currentNode = jsonNode;
  while (currentNode) {
    if (currentNode.parent) {
      const key = currentNode.parent.key;
      path.unshift(key);
      currentNode = currentNode.parent.node;
    } else {
      currentNode = null;
    }
  }
  return path;
};

export const constructJson = (jsonNode: JSONNode): JSONType => {
  if (jsonNode.type == "primitive") {
    return jsonNode.value;
  } else if (jsonNode.type == "array") {
    return jsonNode.items.map(item => constructJson(item));
  } else if (jsonNode.type == "object") {
    return Object.fromEntries(
      Object.keys(jsonNode.properties).map(property => [
        property,
        constructJson(jsonNode.properties[property])
      ])
    );
  }
};

export class JSONTemplateError extends Error {
  private _node: JSONNode;
  private _error: Error;

  constructor(node: JSONNode, error: Error) {
    const message = `Error at ${getPath(node).join(".")} : ${error.message}`;
    super(message);
    this._node = node;
    this._error = error;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get path() {
    return getPath(this._node);
  }

  get node() {
    return this._node;
  }

  get error() {
    return this._error;
  }
}

export const validateKeywords = async (
  jsonNode: JSONNode,
  keywordValidators: Record<string, KeywordValidator>
): Promise<JSONTemplateError[]> => {
  const errors: JSONTemplateError[] = [];
  const keywords = Object.keys(keywordValidators);
  const navigator = async (jsonNode: JSONNode) => {
    if (jsonNode.type == "array") {
      await Promise.all(
        jsonNode.items.map(async item => {
          await navigator(item);
        })
      );
    } else if (jsonNode.type == "object") {
      const properties = Object.keys(jsonNode.properties);
      await Promise.all(
        properties.map(async property => {
          await navigator(jsonNode.properties[property]);
        })
      );

      // validation
      const keywordsInThisObject = intersection(properties, keywords);

      await Promise.all(
        keywordsInThisObject.map(async keyword => {
          const keywordErrorsPromise = keywordValidators[keyword](
            keyword,
            jsonNode,
            constructJson(jsonNode.properties[keyword])
          );
          let keywordErrors = keywordErrorsPromise as Error[];
          if (
            typeof (keywordErrorsPromise as Promise<Error[]>)?.then ==
            "function"
          ) {
            keywordErrors = await keywordErrorsPromise;
          }

          errors.push(
            ...keywordErrors.map(e => new JSONTemplateError(jsonNode, e))
          );
        })
      );
    }
  };
  await navigator(jsonNode);
  return errors;
};

class ReplaceObjectAtLevelError extends Error {
  private _node: JSONNode;
  private _level: number;
  private _replacement: JSONType;

  constructor(node: JSONNode, level: number, replacement: JSONType) {
    super(`Object replacement at level ${level} was not possible`);
    this._node = node;
    this._level = level;
    this._replacement = replacement;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  next() {
    this._level--;
    return this;
  }

  get node() {
    return this._node;
  }

  get level() {
    return this._level;
  }

  get replacement() {
    return this._replacement;
  }
}

export const processKeywords = async (
  jsonNode: JSONNode,
  keywordProcessors: Record<string, KeywordProcessor>
): Promise<JSONType> => {
  const keywords = Object.keys(keywordProcessors);

  const navigator = async (jsonNode: JSONNode): Promise<JSONType> => {
    if (jsonNode.type == "primitive") {
      return jsonNode.value;
    } else if (jsonNode.type == "array") {
      const jsonArray = await Promise.all(
        jsonNode.items.map(item => navigatorWithReplacementHandler(item))
      );
      return jsonArray;
    } else if (jsonNode.type == "object") {
      const properties = Object.keys(jsonNode.properties);
      const jsonObject = Object.fromEntries(
        await Promise.all(
          properties.map(async property => [
            property,
            await navigatorWithReplacementHandler(jsonNode.properties[property])
          ])
        )
      ) as JSONObjectType;

      // replacement
      const keywordsInThisObject = intersection(properties, keywords);
      const objectReplacements: Record<string, KeywordObjectReplacement> = {};
      const keywordReplacements: Record<string, KeywordKeywordReplacement> = {};
      await Promise.all(
        keywordsInThisObject.map(async keyword => {
          try {
            const replacerPromise = keywordProcessors[keyword](
              keyword,
              jsonNode,
              jsonObject[keyword]
            );
            let replacer = replacerPromise as KeywordReplacement;
            if (
              typeof (replacerPromise as Promise<KeywordReplacement>)?.then ==
              "function"
            ) {
              replacer = await replacerPromise;
            }
            if (replacer.type == "object") {
              objectReplacements[keyword] = replacer;
            } else {
              keywordReplacements[keyword] = replacer;
            }
          } catch (e) {
            throw new JSONTemplateError(jsonNode, e);
          }
        })
      );

      const numberOfObjectReplacements = Object.keys(objectReplacements).length;
      const numberOfKeywordReplacements =
        Object.keys(keywordReplacements).length;

      if (
        numberOfObjectReplacements > 1 ||
        (numberOfObjectReplacements == 1 && numberOfKeywordReplacements > 0)
      ) {
        throw new JSONTemplateError(
          jsonNode,
          new Error(
            `Object replacement can not be combined with other object/keyword replacements. The keywords are ${keywordsInThisObject.join(
              ", "
            )}`
          )
        );
      }

      if (numberOfObjectReplacements == 1) {
        const replacement = Object.values(objectReplacements)[0];
        if (replacement.level > 0) {
          throw new ReplaceObjectAtLevelError(
            jsonNode,
            replacement.level,
            replacement.value
          );
        }
        return Object.values(objectReplacements)[0].value;
      } else {
        Object.keys(keywordReplacements).forEach(k => {
          delete jsonObject[k];
          const replacement = keywordReplacements[k].value;
          Object.keys(replacement).forEach(newKey => {
            jsonObject[newKey] = replacement[newKey];
          });
        });
        return jsonObject;
      }
    }
  };

  const navigatorWithReplacementHandler = async (
    jsonNode: JSONNode
  ): Promise<JSONType> => {
    try {
      return await navigator(jsonNode);
    } catch (e) {
      if (e instanceof ReplaceObjectAtLevelError) {
        if (e.level > 0) {
          throw e.next();
        } else {
          return e.replacement;
        }
      } else {
        throw e;
      }
    }
  };

  try {
    return await navigatorWithReplacementHandler(jsonNode);
  } catch (e) {
    if (e instanceof ReplaceObjectAtLevelError) {
      throw new JSONTemplateError(e.node, e);
    } else {
      throw e;
    }
  }
};
