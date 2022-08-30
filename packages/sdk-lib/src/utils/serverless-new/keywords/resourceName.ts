import { JSONType } from "../../jsonTemplate";
import { KeywordDefinition } from "../../keywords/types";
import { getSAMResourceName } from "../utils";

export const keyword = "SOMOD::ResourceName";

export const keywordResourceName: KeywordDefinition<string> = {
  keyword: "SOMOD::ResourceName",

  getValidator: async () => (keyword, node, value) => {
    const errors: Error[] = [];

    if (Object.keys(node.properties).length > 1) {
      errors.push(
        new Error(`Object with ${keyword} must not have additional properties`)
      );
    } else if (typeof value != "string") {
      errors.push(new Error(`${keyword} value must be string`));
    }

    return errors;
  },

  getProcessor: async (rootDir, moduleName) => (keyword, node, value) => {
    return {
      type: "object",
      value: getSAMResourceName(moduleName, value) as JSONType
    };
  }
};
