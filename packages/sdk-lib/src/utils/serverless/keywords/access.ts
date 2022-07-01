import { KeywordSLPAccess, ServerlessTemplate, SLPTemplate } from "../types";

export const checkAccess = (
  sourceModule: string,
  path: string[],
  targetResource: string,
  targetSlpTemplate: SLPTemplate
): Error[] => {
  const errors: Error[] = [];

  const access =
    targetSlpTemplate.Resources[targetResource][KeywordSLPAccess] || "scope";

  if (access == "module" && sourceModule != targetSlpTemplate.module) {
    errors.push(
      new Error(
        `Referenced module resource {${
          targetSlpTemplate.module
        }, ${targetResource}} can not be accessed (has "module" access). Referenced in "${sourceModule}" at "Resources/${path.join(
          "/"
        )}"`
      )
    );
  }

  if (
    access == "scope" &&
    sourceModule.split("/")[0] != targetSlpTemplate.module.split("/")[0]
  ) {
    errors.push(
      new Error(
        `Referenced module resource {${
          targetSlpTemplate.module
        }, ${targetResource}} can not be accessed (has "scope" access). Referenced in "${sourceModule}" at "Resources/${path.join(
          "/"
        )}"`
      )
    );
  }

  return errors;
};

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPAccess].forEach(outputPath => {
      const resourceId = outputPath[0];
      delete slpTemplate.Resources[resourceId][KeywordSLPAccess];
    });
  });
};
