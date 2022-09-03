import { KeywordDefinition } from "@somod/types";

export const keywordJsonParse: KeywordDefinition<string> = {
  keyword: "SOMOD::JsonParse",
  getValidator: async () => (keyword, node) => {
    const errors: Error[] = [];
    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    }

    return errors;
  },
  getProcessor: async () => (keyword, node, value) => {
    return {
      type: "object",
      value: JSON.parse(value)
    };
  }
};
