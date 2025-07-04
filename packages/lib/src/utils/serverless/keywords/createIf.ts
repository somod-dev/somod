import { KeywordDefinition } from "somod-types";
import { getPath } from "../../jsonTemplate";

export const keywordCreateIf: KeywordDefinition<boolean> = {
  keyword: "SOMOD::CreateIf",

  getValidator: async () => (keyword, node) => {
    const errors: Error[] = [];

    const path = getPath(node);
    if (!(path.length == 2 && path[0] == "Resources")) {
      errors.push(new Error(`${keyword} is allowed only as Resource Property`));
    }

    //NOTE: structure of the value is validated by serverless-schema

    return errors;
  },

  getProcessor: async () => (keyword, node, value) => {
    return {
      type: "keyword",
      value: value ? {} : { Condition: "SkipCreation" }
    };
  }
};
