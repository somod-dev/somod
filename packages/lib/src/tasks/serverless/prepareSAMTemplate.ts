import { IContext } from "somod-types";
import { join } from "path";
import { file_templateYaml } from "../../utils/constants";
import { prepareSamTemplate } from "../../utils/serverless/serverlessTemplate/prepare";
import { saveYamlFileStore, updateYamlFileStore } from "nodejs-file-utils";

export const prepareSAMTemplate = async (context: IContext): Promise<void> => {
  const samTemplate = await prepareSamTemplate(context);

  if (samTemplate.Resources && Object.keys(samTemplate.Resources).length > 0) {
    const completeSamTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Transform: "AWS::Serverless-2016-10-31",
      Globals: {
        Function: {
          Runtime: `nodejs${context.serverlessTemplateHandler.functionNodeRuntimeVersion}.x`,
          Handler: "index.default",
          Architectures: ["arm64"]
        }
      },
      Conditions: {
        SkipCreation: { "Fn::Equals": ["1", "0"] }
      },
      ...samTemplate
    };

    const templateYamlPath = join(context.dir, file_templateYaml);

    updateYamlFileStore(templateYamlPath, completeSamTemplate);
    await saveYamlFileStore(templateYamlPath);
  }
};
