import { KeywordDefinition, ServerlessResource } from "somod-types";
import { getPath } from "../../jsonTemplate";

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
  resource: ServerlessResource,
  accessedModule: string,
  accessedResource: string,
  fromModule: string,
  referenceType: "Referenced" | "Extended" | "Depended" = "Referenced"
) => {
  const access = (resource[keywordAccess.keyword] || "scope") as Access;

  if (access == "module" && fromModule != accessedModule) {
    throw new Error(
      `${referenceType} module resource {${accessedModule}, ${accessedResource}} can not be accessed (has "module" access).`
    );
  }

  if (
    access == "scope" &&
    fromModule.split("/")[0] != accessedModule.split("/")[0]
  ) {
    throw new Error(
      `Referenced module resource {${accessedModule}, ${accessedResource}} can not be accessed (has "scope" access).`
    );
  }
};
