import { file_parametersYaml } from "../../constants";
import { getPath, JSONType } from "../../jsonTemplate";
import { KeywordDefinition } from "../../keywords/types";
import { listAllParameters } from "../../parameters/namespace";
import { getSAMOutputName } from "../utils";
import { ServerlessTemplate } from "../types";

type Outputs = Record<string, JSONType>;

export const keywordTemplateOutputs: KeywordDefinition<
  Outputs,
  ServerlessTemplate
> = {
  keyword: "Outputs",

  getValidator: async rootDir => {
    const parameters = Object.keys(await listAllParameters(rootDir));
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

  getProcessor: async () => (keyword, node, value) => {
    if (getPath(node).length == 0) {
      return {
        type: "keyword",
        value: {
          [keyword]: Object.fromEntries(
            Object.keys(value).map(p => [
              getSAMOutputName(p),
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
  }
};
