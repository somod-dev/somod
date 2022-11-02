import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import {
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessTemplate
} from "somod-types";

type Extend = { module: string; resource: string };

export const keywordExtend: KeywordDefinition<Extend, ServerlessTemplate> = {
  keyword: "SOMOD::Extend",

  getValidator: async (rootDir, moduleName, moduleContentMap) => {
    return (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (!(path.length == 2 && path[0] == "Resources")) {
        errors.push(
          new Error(`${keyword} is allowed only as Resource Property`)
        );
      } else {
        //NOTE: structure of the value is validated by serverless-schema

        if (value.module == moduleName) {
          errors.push(
            new Error(
              `Can not extend the resource ${value.resource} in the same module ${moduleName}. Edit the resource directly`
            )
          );
        } else if (
          !moduleContentMap[value.module]?.json.Resources[value.resource]
        ) {
          errors.push(
            new Error(
              `Extended module resource {${value.module}, ${value.resource}} not found.`
            )
          );
        } else {
          const fromType = (node.properties["Type"] as JSONPrimitiveNode).value;
          const toType =
            moduleContentMap[value.module].json.Resources[value.resource].Type;

          if (fromType != toType) {
            errors.push(
              new Error(
                `Can extend only same type of resource. ${fromType} can not extend ${toType}`
              )
            );
          }

          errors.push(
            ...checkAccess(
              moduleName,
              moduleContentMap[value.module],
              value.resource
            )
          );
        }
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
