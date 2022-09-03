import { JSONArrayType, KeywordDefinition } from "@somod/types";
import { isArray } from "lodash";

export const keywordIf: KeywordDefinition<JSONArrayType> = {
  keyword: "SOMOD::If",
  getValidator: async () => (keyword, node, value) => {
    const errors: Error[] = [];
    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    }

    if (!isArray(value)) {
      errors.push(new Error(`${keyword} value must be array`));
    } else if (value.length < 2 || value.length > 3) {
      errors.push(
        new Error(
          `${keyword} value must be array matching [Condition, ValueIfTrue, ValueIfFalse]`
        )
      );
    }
    return errors;
  },

  getProcessor: async () => (keyword, node, value) => {
    const result = value[0] ? value[1] : value[2];
    return {
      type: "object",
      value: result
    };
  }
};
