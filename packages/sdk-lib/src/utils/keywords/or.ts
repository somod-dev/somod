import { isArray } from "lodash";
import { JSONArrayType } from "../jsonTemplate";
import { KeywordDefinition } from "./types";

export const keywordOr: KeywordDefinition<JSONArrayType> = {
  keyword: "SOMOD::Or",

  getValidator: async () => (keyword, node, value) => {
    const errors: Error[] = [];
    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    }

    if (!isArray(value)) {
      errors.push(new Error(`${keyword} value must be array`));
    } else if (value.length < 1) {
      errors.push(new Error(`${keyword} value must contain atleast 1 value`));
    }
    return errors;
  },

  getProcessor: async () => (keyword, node, value) => {
    let result = false;
    for (const v of value) {
      result = result || !!v;
      if (result === true) {
        break;
      }
    }
    return {
      type: "object",
      value: result
    };
  }
};
