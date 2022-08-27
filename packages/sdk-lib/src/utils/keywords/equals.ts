import { isArray, isEqual } from "lodash";
import { JSONArrayType } from "../jsonTemplate";
import { KeywordDefinition } from "./types";

export const keywordEquals: KeywordDefinition<JSONArrayType> = {
  keyword: "SOMOD::Equals",
  getValidator: async () => (keyword, node, value) => {
    const errors: Error[] = [];
    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    }

    if (!isArray(value)) {
      errors.push(new Error(`${keyword} value must be array`));
    } else if (value.length != 2) {
      errors.push(
        new Error(`${keyword} value must be array matching [Value1, Value2]`)
      );
    }
    return errors;
  },

  getProcessor: async () => (keyword, node, value) => {
    const result = isEqual(value[0], value[1]);
    return {
      type: "object",
      value: result
    };
  }
};
