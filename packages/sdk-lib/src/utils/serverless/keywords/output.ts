import { getPath } from "../../jsonTemplate";
import { KeywordDefinition, ModuleContent } from "../../keywords/types";
import { ServerlessTemplate } from "../types";

type Output = {
  default: boolean;
  attributes: string[];
};

export const keywordOutput: KeywordDefinition<Output, ServerlessTemplate> = {
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
  targetTemplate: ModuleContent<ServerlessTemplate>,
  targetResource: string,
  attribute?: string
): Error[] => {
  const errors: Error[] = [];

  const outputDefinitionInTargetResource = targetTemplate.json.Resources[
    targetResource
  ]?.[keywordOutput.keyword] as Output;

  if (attribute === undefined) {
    if (!outputDefinitionInTargetResource?.default) {
      errors.push(
        new Error(
          `default must be true in ${keywordOutput.keyword} of ${targetResource} resource in ${targetTemplate.moduleName}.`
        )
      );
    }
  } else if (
    !outputDefinitionInTargetResource?.attributes.includes(attribute)
  ) {
    errors.push(
      new Error(
        `attributes must have ${attribute} in ${keywordOutput.keyword} of ${targetResource} resource in ${targetTemplate.moduleName}.`
      )
    );
  }

  return errors;
};
