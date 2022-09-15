import { getCompiledValidator } from "decorated-ajv";
import { JSONObjectType, KeywordDefinition } from "somod-types";

export const keywordAjvCompile: KeywordDefinition<JSONObjectType> = {
  keyword: "SOMOD::AjvCompile",

  getValidator: async () => (keyword, node) => {
    const errors: Error[] = [];
    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    }
    return errors;
  },

  getProcessor: async () => async (keyword, node, value) => {
    return {
      type: "object",
      value: await getCompiledValidator(value)
    };
  }
};
