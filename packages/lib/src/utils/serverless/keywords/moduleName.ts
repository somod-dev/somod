import { KeywordDefinition } from "somod-types";

export const keywordModuleName: KeywordDefinition<boolean> = {
  keyword: "SOMOD::ModuleName",

  getValidator: async () => (keyword, node, value) => {
    const errors: Error[] = [];

    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    } else if (value !== true) {
      errors.push(new Error(`${keyword} value must equal to true`));
    }

    return errors;
  },

  getProcessor: async moduleName => () => {
    return {
      type: "object",
      value: moduleName
    };
  }
};
