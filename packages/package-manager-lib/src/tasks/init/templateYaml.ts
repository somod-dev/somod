import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { path_serverless, file_templateYaml } from "../../utils/constants";

export const templateYaml = async (dir: string): Promise<void> => {
  const templatePath = join(dir, path_serverless, file_templateYaml);

  const templateContent = `# yaml-language-server: $schema=../node_modules/@sodaru-cli/serverless-schema/schemas/index.json

Resources:
  SampleParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name:
        SLP::ResourceName: Hello
      Description: "TODO${":"} This is a sample resource , Delete this and add the valid resources for your module"
      Type: String
      Value: Good Luck

`;

  if (!existsSync(templatePath)) {
    const templateDir = dirname(templatePath);
    await mkdir(templateDir, { recursive: true });
    await writeFile(templatePath, templateContent);
  }
};
