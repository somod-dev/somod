import { isArray } from "lodash";
import { JSONArrayType, JSONObjectType } from "../jsonTemplate";
import { KeywordDefinition } from "./types";

export const keywordKey: KeywordDefinition<
  [JSONObjectType | JSONArrayType, string | number]
> = {
  keyword: "SOMOD::Key",

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
        new Error(
          `${keyword} value must be array matching [ArrayOrObject, IndexOrPropertyName]`
        )
      );
    }
    return errors;
  },

  getProcessor: async () => (keyword, node, value) => {
    return {
      type: "object",
      value: value[0][value[1]]
    };
  }
};
