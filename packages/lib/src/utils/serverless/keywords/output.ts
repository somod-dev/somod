import { KeywordDefinition, ServerlessResource } from "somod-types";
import { getPath } from "../../jsonTemplate";

type Output = {
  default?: boolean;
  attributes?: string[];
};

export const keywordOutput: KeywordDefinition<Output> = {
  keyword: "SOMOD::Output",

  getValidator: async () => {
    return (keyword, node) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (!(path.length == 2 && path[0] == "Resources")) {
        errors.push(
          new Error(`${keyword} is allowed only as Resource Property`)
        );
      }

      //NOTE: structure of the value is validated by serverless-schema

      return errors;
    };
  },

  getProcessor: async () => () => {
    return {
      type: "keyword",
      value: {}
    };
  }
};

export const checkOutput = (
  resource: ServerlessResource,
  referencedModule: string,
  referencedResource: string,
  referencedAttribute?: string
) => {
  const outputDefinitionInTargetResource = resource[
    keywordOutput.keyword
  ] as Output;

  if (referencedAttribute === undefined) {
    if (outputDefinitionInTargetResource?.default === false) {
      throw new Error(
        `default must be true in ${keywordOutput.keyword} of ${referencedResource} resource in ${referencedModule}.`
      );
    }
  } else if (
    !outputDefinitionInTargetResource?.attributes?.includes(referencedAttribute)
  ) {
    throw new Error(
      `attributes must have ${referencedAttribute} in ${keywordOutput.keyword} of ${referencedResource} resource in ${referencedModule}.`
    );
  }
};
