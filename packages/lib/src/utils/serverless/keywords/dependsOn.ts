import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import { KeywordDefinition, ServerlessTemplate } from "somod-types";
import { ServerlessTemplateHandler } from "../serverlessTemplate/serverlessTemplate";

type DependsOn = { module?: string; resource: string }[];

export const keywordDependsOn: KeywordDefinition<
  DependsOn,
  ServerlessTemplate
> = {
  keyword: "SOMOD::DependsOn",

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

        value.forEach(v => {
          const targetModuleName = v.module || moduleName;
          if (!moduleContentMap[targetModuleName]?.json.Resources[v.resource]) {
            errors.push(
              new Error(
                `Dependent module resource {${targetModuleName}, ${v.resource}} not found.`
              )
            );
          }
          errors.push(
            ...checkAccess(
              moduleName,
              moduleContentMap[targetModuleName],
              v.resource
            )
          );
        });
      }

      return errors;
    };
  },

  getProcessor: async (rootDir, moduleName) => {
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    return (keyword, node, value) => ({
      type: "keyword",
      value: {
        DependsOn: value.map(v =>
          serverlessTemplateHandler.getSAMResourceLogicalId(
            v.module || moduleName,
            v.resource
          )
        )
      }
    });
  }
};
