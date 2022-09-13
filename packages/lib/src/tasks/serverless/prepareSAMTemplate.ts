import { KeywordDefinition } from "somod-types";
import { join } from "path";
import { file_templateYaml } from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { prepareSamTemplate } from "../../utils/serverless/serverlessTemplate/prepare";
import { loadServerlessTemplateMap } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";
import { getNodeRuntimeVersion } from "../../utils/serverless/utils";
import { saveYamlFileStore, updateYamlFileStore } from "nodejs-file-utils";

export const prepareSAMTemplate = async (
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const moduleNodes = await moduleHandler.listModules();
  const moduleTemplateMap = await loadServerlessTemplateMap(
    moduleNodes.map(m => m.module)
  );

  const samTemplate = await prepareSamTemplate(
    dir,
    moduleNodes.map(m => m.module.name),
    moduleTemplateMap,
    pluginKeywords
  );

  if (samTemplate.Resources && Object.keys(samTemplate.Resources).length > 0) {
    const completeSamTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Transform: "AWS::Serverless-2016-10-31",
      Globals: {
        Function: {
          Runtime: `nodejs${getNodeRuntimeVersion()}.x`,
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
