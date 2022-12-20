import { IServerlessTemplateHandler, KeywordDefinition } from "somod-types";
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

export const checkAccess = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  sourceModule: string,
  accessedResource: { module?: string; resource: string },
  usage?: string
): Promise<Error[]> => {
  const errors: Error[] = [];

  const accessedModule = accessedResource.module || sourceModule;

  const resource = await serverlessTemplateHandler.getBaseResource(
    accessedModule,
    accessedResource.resource,
    true
  );

  if (!resource) {
    errors.push(
      new Error(
        `${usage || "Referenced"} module resource {${accessedModule}, ${
          accessedResource.resource
        }} not found.`
      )
    );
  } else {
    const access = (resource[keywordAccess.keyword] || "scope") as Access;

    if (access == "module" && sourceModule != accessedModule) {
      errors.push(
        new Error(
          `Referenced module resource {${accessedModule}, ${accessedResource.resource}} can not be accessed (has "module" access).`
        )
      );
    }

    if (
      access == "scope" &&
      sourceModule.split("/")[0] != accessedModule.split("/")[0]
    ) {
      errors.push(
        new Error(
          `Referenced module resource {${accessedModule}, ${accessedResource.resource}} can not be accessed (has "scope" access).`
        )
      );
    }
  }

  return errors;
};
