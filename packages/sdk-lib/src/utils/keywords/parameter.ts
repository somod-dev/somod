import { file_parametersYaml } from "../constants";
import { KeywordObjectReplacement } from "../jsonTemplate";
import { loadAllParameterValues } from "../parameters/load";
import { listAllParameters } from "../parameters/namespace";
import { KeywordDefinition } from "./types";

export const keywordParameter: KeywordDefinition<string> = {
  keyword: "SOMOD::Parameter",

  getValidator: async () => {
    const parameters = Object.keys(await listAllParameters());
    return (keyword, node, value) => {
      const errors: Error[] = [];
      if (Object.keys(node.properties).length > 1) {
        errors.push(
          new Error(
            `Object with ${keyword} must not have additional properties`
          )
        );
      }

      if (typeof value != "string") {
        errors.push(new Error(`${keyword} value must be string`));
      } else if (!parameters.includes(value)) {
        errors.push(
          new Error(
            `parameter ${value} referenced by ${keyword} does not exist. Define ${value} in /${file_parametersYaml}`
          )
        );
      }
      return errors;
    };
  },

  getProcessor: async rootDir => {
    const parameters = await loadAllParameterValues(rootDir);
    return (keyword, node, value) => {
      return {
        type: "object",
        value: parameters[value]
      } as KeywordObjectReplacement;
    };
  }
};
