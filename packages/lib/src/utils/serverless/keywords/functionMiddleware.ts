import { existsSync } from "fs";
import { listFiles } from "nodejs-file-utils";
import { basename, extname, join } from "path";
import {
  JSONObjectNode,
  JSONPrimitiveNode,
  JSONType,
  KeywordDefinition
} from "somod-types";
import {
  path_functions,
  path_middlewares,
  path_serverless,
  resourceType_FunctionMiddleware
} from "../../constants";
import { getPath } from "../../jsonTemplate";

const validateKeywordPosition = (node: JSONObjectNode) => {
  const path = getPath(node);
  if (
    !(
      path.length == 4 &&
      path[0] == "Resources" &&
      path[2] == "Properties" &&
      path[3] == "CodeUri" &&
      (
        (node.parent.node.parent.node as JSONObjectNode).properties
          ?.Type as JSONPrimitiveNode
      ).value == resourceType_FunctionMiddleware
    )
  ) {
    throw new Error(
      `${keywordFunctionMiddleware.keyword} is allowed only as value of CodeUri property of ${resourceType_FunctionMiddleware} resource`
    );
  }
};

const validateFunctionMiddlewareIsDefined = (
  definedFunctionMiddlewares: string[],
  functionMiddlewareName: string
) => {
  if (!definedFunctionMiddlewares.includes(functionMiddlewareName)) {
    throw new Error(
      `Function Middleware ${functionMiddlewareName} not found. Create the middleware under ${path_serverless}/${path_functions}/${path_middlewares} directory`
    );
  }
};

export type FunctionMiddlewareProperties = {
  CodeUri: KeywordSomodFunctionMiddleware;
  Layers?: JSONType[];
  Environment?: { Variables?: Record<string, JSONType> };
} & Record<string, JSONType>;

type FunctionMiddlewareType = {
  name: string;
  allowedTypes?: string[];
};

export type KeywordSomodFunctionMiddleware = {
  "SOMOD::FunctionMiddleware": FunctionMiddlewareType;
};

const getDefinedFunctionMiddlewares = async (dir: string) => {
  const middlewaresDir = join(
    dir,
    path_serverless,
    path_functions,
    path_middlewares
  );
  if (!existsSync(middlewaresDir)) {
    return [];
  }
  const files = await listFiles(middlewaresDir);
  const middlewares = files
    .filter(file => file.indexOf("/") == -1)
    .map(file => basename(file, extname(file)));
  return middlewares;
};

export const keywordFunctionMiddleware: KeywordDefinition<FunctionMiddlewareType> =
  {
    keyword: "SOMOD::FunctionMiddleware",

    getValidator: async (moduleName, context) => {
      const definedMiddlewares = await getDefinedFunctionMiddlewares(
        context.dir
      );
      return (keyword, node, value) => {
        const errors: Error[] = [];

        try {
          validateKeywordPosition(node);
          validateFunctionMiddlewareIsDefined(definedMiddlewares, value.name);
        } catch (e) {
          errors.push(e);
        }

        return errors;
      };
    },

    getProcessor: async () => () => {
      return {
        type: "object",
        value: undefined,
        level: 2
      };
    }
  };
