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
  KeywordReplacement
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
        jsonNode.items.map(item => navigator(item))
      );
      return jsonArray;
    } else if (jsonNode.type == "object") {
      const properties = Object.keys(jsonNode.properties);
      const jsonObject = Object.fromEntries(
        await Promise.all(
          properties.map(async property => [
            property,
            await navigator(jsonNode.properties[property])
          ])
        )
      );

      // replacement
      const keywordsInThisObject = intersection(properties, keywords);
      const keywordReplacements = await Promise.all(
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
            return { ...replacer, keyword };
          } catch (e) {
            throw new JSONTemplateError(jsonNode, e);
          }
        })
      );
      const keywordObjectReplacements = keywordReplacements.filter(
        r => r.type == "object"
      );
      if (keywordObjectReplacements.length > 1) {
        throw new Error(
          `Object replacement is allowed for only one keyword, Found ${keywordObjectReplacements.map(
            r => r.keyword
          )}`
        );
      }

      let resultObject =
        keywordObjectReplacements.length == 1
          ? keywordObjectReplacements[0].value
          : jsonObject;

      if (isPlainObject(resultObject)) {
        keywordReplacements.forEach(r => {
          if (r.type == "keyword") {
            delete resultObject[r.keyword];
            resultObject = { ...(resultObject as JSONObjectType), ...r.value };
          }
        });
      }
      return resultObject;
    }
  };
  return await navigator(jsonNode);
};
