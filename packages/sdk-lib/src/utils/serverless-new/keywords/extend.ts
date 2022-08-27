import { getPath, JSONPrimitiveNode } from "../../jsonTemplate";
import { KeywordDefinition } from "../../keywords/types";
import { getSAMResourceLogicalId } from "../../serverless/utils";
import { SAMTemplate, ServerlessTemplate } from "../types";
import { checkAccess } from "./access";

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

  getProcessor: async () => (keyword, node, value) => {
    return {
      type: "keyword",
      value: {
        [keyword]: getSAMResourceLogicalId(value.module, value.resource)
      }
    };
  }
};

export const getExtendedResourceMap = (
  samTemplate: SAMTemplate
): Record<string, string> => {
  const extendedMap: Record<string, string> = {};
  Object.keys(samTemplate.Resources).forEach(resourceId => {
    if (
      samTemplate.Resources[resourceId][keywordExtend.keyword] !== undefined
    ) {
      extendedMap[resourceId] = samTemplate.Resources[resourceId][
        keywordExtend.keyword
      ] as string;
    }
  });

  return extendedMap;
};
