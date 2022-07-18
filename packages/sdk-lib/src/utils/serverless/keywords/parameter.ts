import { file_templateYaml, path_serverless } from "../../constants";
import { baseModuleName } from "../baseModule";
import { separateParameterSpace } from "../parameter";
import {
  KeywordSOMODParameter,
  ServerlessTemplate,
  SOMODParameter,
  SLPTemplate
} from "../types";
import {
  getParameterSpaceResourceLogicalId,
  getSAMResourceLogicalId,
  getSOMODKeyword,
  replaceSOMODKeyword
} from "../utils";

export const validate = (
  slpTemplate: SLPTemplate,
  parameters: string[]
): Error[] => {
  const errors: Error[] = [];

  const missingParameters: string[] = [];
  slpTemplate.keywordPaths[KeywordSOMODParameter].forEach(
    refParameterKeywordPath => {
      const refParameter = getSOMODKeyword<SOMODParameter>(
        slpTemplate,
        refParameterKeywordPath
      )[KeywordSOMODParameter];

      if (!parameters.includes(refParameter)) {
        missingParameters.push(refParameter);
      }
    }
  );

  if (missingParameters.length > 0) {
    errors.push(
      new Error(
        `Following parameters referenced from '${path_serverless}/${file_templateYaml}' are not found\n${missingParameters
          .map(p => " - " + p)
          .join("\n")}`
      )
    );
  }

  return errors;
};

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODParameter].forEach(parameterPath => {
      const parameter = getSOMODKeyword<SOMODParameter>(
        slpTemplate,
        parameterPath
      )[KeywordSOMODParameter];

      const { parameterSpace, param } = separateParameterSpace(parameter);

      const parameterValue = {
        "Fn::GetAtt": [
          `${getSAMResourceLogicalId(
            baseModuleName,
            getParameterSpaceResourceLogicalId(parameterSpace)
          )}`,
          param
        ]
      };
      replaceSOMODKeyword(slpTemplate, parameterPath, parameterValue);
    });
  });
};
