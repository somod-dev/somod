import { join } from "path";
import { file_templateYaml } from "../../utils/constants";
import { generateSAMTemplate as _generateSAMTemplate } from "../../utils/serverless/generateSAMTemplate";
import {
  saveYamlFileStore,
  updateYamlFileStore
} from "../../utils/yamlFileStore";

export const generateSAMTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const samTemplate = await _generateSAMTemplate(dir, moduleIndicators);

  if (samTemplate.Resources && Object.keys(samTemplate.Resources).length > 0) {
    const completeSamTemplate = {
      AWSTemplateFormatVersion: "2010-09-09",
      Transform: "AWS::Serverless-2016-10-31",
      Globals: {
        Function: {
          Runtime: "nodejs16.x",
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
