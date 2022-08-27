import { KeywordDefinition } from "./types";

export const keywordJsonStringify: KeywordDefinition = {
  keyword: "SOMOD::JsonStringify",
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
      value: JSON.stringify(value)
    };
  }
};
