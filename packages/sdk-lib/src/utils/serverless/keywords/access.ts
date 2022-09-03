import { KeywordDefinition, ModuleTemplate } from "@somod/types";
import { getPath } from "../../jsonTemplate";
import { ServerlessTemplate } from "../types";

type Access = "module" | "scope" | "public";

export const keywordAccess: KeywordDefinition<Access> = {
  keyword: "SOMOD::Access",

  getValidator: async () => (keyword, node) => {
    const errors: Error[] = [];

    const path = getPath(node);
    if (!(path.length == 2 && path[0] == "Resources")) {
      errors.push(new Error(`${keyword} is allowed only as Resource Property`));
    }

    //NOTE: structure of the value is validated by serverless-schema

    return errors;
  },

  getProcessor: async () => () => ({
    type: "keyword",
    value: {}
  })
};

export const checkAccess = (
  sourceModule: string,
  targetTemplate: ModuleTemplate<ServerlessTemplate>,
  targetResource: string
): Error[] => {
  const errors: Error[] = [];

  const access = (targetTemplate.json.Resources[targetResource][
    keywordAccess.keyword
  ] || "scope") as Access;

  if (access == "module" && sourceModule != targetTemplate.moduleName) {
    errors.push(
      new Error(
        `Referenced module resource {${targetTemplate.moduleName}, ${targetResource}} can not be accessed (has "module" access).`
      )
    );
  }

  if (
    access == "scope" &&
    sourceModule.split("/")[0] != targetTemplate.moduleName.split("/")[0]
  ) {
    errors.push(
      new Error(
        `Referenced module resource {${targetTemplate.moduleName}, ${targetResource}} can not be accessed (has "scope" access).`
      )
    );
  }

  return errors;
};
