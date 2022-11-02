import { KeywordDefinition } from "somod-types";
import { join } from "path";
import { file_templateYaml } from "../../utils/constants";
import { prepareSamTemplate } from "../../utils/serverless/serverlessTemplate/prepare";
import { saveYamlFileStore, updateYamlFileStore } from "nodejs-file-utils";
import { ServerlessTemplateHandler } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";

export const prepareSAMTemplate = async (
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
): Promise<void> => {
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();

  const samTemplate = await prepareSamTemplate(dir, pluginKeywords);

  if (samTemplate.Resources && Object.keys(samTemplate.Resources).length > 0) {
    const completeSamTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Transform: "AWS::Serverless-2016-10-31",
      Globals: {
        Function: {
          Runtime: `nodejs${serverlessTemplateHandler.getNodeRuntimeVersion()}.x`,
          Handler: "index.default",
          Architectures: ["arm64"]
        }
      },
      ...samTemplate
    };

    const templateYamlPath = join(dir, file_templateYaml);

    updateYamlFileStore(templateYamlPath, completeSamTemplate);
    await saveYamlFileStore(templateYamlPath);
  }
};
