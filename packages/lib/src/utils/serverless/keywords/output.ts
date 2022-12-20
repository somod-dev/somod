import { IServerlessTemplateHandler, KeywordDefinition } from "somod-types";
import { getPath } from "../../jsonTemplate";

type Output = {
  default: boolean;
  attributes: string[];
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

export const checkOutput = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  currentModule: string,
  resource: string,
  module?: string,
  attribute?: string
): Promise<Error[]> => {
  const errors: Error[] = [];

  const targetModule = module || currentModule;

  const targetResource = await serverlessTemplateHandler.getBaseResource(
    targetModule,
    resource,
    true
  );

  const outputDefinitionInTargetResource = targetResource?.[
    keywordOutput.keyword
  ] as Output;

  if (attribute === undefined) {
    if (!outputDefinitionInTargetResource?.default) {
      errors.push(
        new Error(
          `default must be true in ${keywordOutput.keyword} of ${resource} resource in ${targetModule}.`
        )
      );
    }
  } else if (
    !outputDefinitionInTargetResource?.attributes.includes(attribute)
  ) {
    errors.push(
      new Error(
        `attributes must have ${attribute} in ${keywordOutput.keyword} of ${resource} resource in ${targetModule}.`
      )
    );
  }

  return errors;
};
