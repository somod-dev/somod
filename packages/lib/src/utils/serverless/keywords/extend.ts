import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import { KeywordDefinition } from "somod-types";
import { Operation } from "json-object-merge";

export type Extend = {
  module: string;
  resource: string;
  rules?: Record<string, Operation>;
};

export const keywordExtend: KeywordDefinition<Extend> = {
  keyword: "SOMOD::Extend",

  getValidator: async (
    rootDir,
    moduleName,
    moduleHandler,
    serverlessTemplateHandler
  ) => {
    return async (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (!(path.length == 2 && path[0] == "Resources")) {
        errors.push(
          new Error(`${keyword} is allowed only as Resource Property`)
        );
      } else {
        //NOTE: structure of the value is validated by serverless-schema

        errors.push(
          ...(await checkAccess(
            serverlessTemplateHandler,
            moduleName,
            value,
            "Extended"
          ))
        );
      }

      return errors;
    };
  },

  getProcessor: async () => () => {
    return {
      type: "object",
      value: undefined // removes the resource
    };
  }
};
