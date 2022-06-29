import { file_templateYaml, path_serverless } from "../../constants";
import { baseModuleName } from "../baseModule";
import {
  KeywordSLPParameter,
  ServerlessTemplate,
  SLPParameter,
  SLPTemplate
} from "../types";
import {
  getParameterSpaceResourceLogicalId,
  getSAMResourceLogicalId,
  getSLPKeyword,
  replaceSLPKeyword
} from "../utils";

export const validate = (
  slpTemplate: SLPTemplate,
  parameters: string[]
): Error[] => {
  const errors: Error[] = [];

  const missingParameters: string[] = [];
  slpTemplate.keywordPaths[KeywordSLPParameter].forEach(
    refParameterKeywordPath => {
      const refParameter = getSLPKeyword<SLPParameter>(
        slpTemplate,
        refParameterKeywordPath
      )[KeywordSLPParameter];

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
    slpTemplate.keywordPaths[KeywordSLPParameter].forEach(parameterPath => {
      const parameter = getSLPKeyword<SLPParameter>(slpTemplate, parameterPath)[
        KeywordSLPParameter
      ];

      const [parameterSpace, ...parameterNameChunks] = parameter.split(".");
      const parameterName = parameterNameChunks.join(".");

      const parameterValue = {
        "Fn::GetAtt": [
          `${getSAMResourceLogicalId(
            baseModuleName,
            getParameterSpaceResourceLogicalId(parameterSpace)
          )}`,
          parameterName
        ]
      };
      replaceSLPKeyword(slpTemplate, parameterPath, parameterValue);
    });
  });
};
