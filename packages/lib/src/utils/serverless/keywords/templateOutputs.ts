import { file_parametersYaml } from "../../constants";
import { getPath } from "../../jsonTemplate";
import { listAllParameters } from "../../parameters/namespace";
import { JSONType, KeywordDefinition } from "somod-types";
import { ServerlessTemplateHandler } from "../serverlessTemplate/serverlessTemplate";

type Outputs = Record<string, JSONType>;

export const keywordTemplateOutputs: KeywordDefinition<Outputs> = {
  keyword: "Outputs",

  getValidator: async () => {
    const parameters = Object.keys(await listAllParameters());
    return (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (path.length == 0) {
        // consider as keyword only if found at the top of the template

        //NOTE: structure of the value is validated by serverless-schema

        Object.keys(value).forEach(parameter => {
          if (!parameters.includes(parameter)) {
            errors.push(
              new Error(
                `parameter ${parameter} referenced by ${keyword} does not exist. Define ${parameter} in /${file_parametersYaml}`
              )
            );
          }
        });
      }

      return errors;
    };
  },

  getProcessor: async () => {
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    return (keyword, node, value) => {
      if (getPath(node).length == 0) {
        return {
          type: "keyword",
          value: {
            [keyword]: Object.fromEntries(
              Object.keys(value).map(p => [
                serverlessTemplateHandler.getSAMOutputName(p),
                { Value: value[p] }
              ])
            )
          }
        };
      }
      return {
        type: "keyword",
        value: {
          [keyword]: value
        }
      };
    };
  }
};
