import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { file_parametersYaml } from "../../utils/constants";

export const initParametersYaml = async (dir: string): Promise<void> => {
  const parametersPath = join(dir, file_parametersYaml);

  const parametersContent = `# yaml-language-server: $schema=./node_modules/@somod/parameters-schema/schemas/index.json

Parameters: {}

`;

  if (!existsSync(parametersPath)) {
    const templateDir = dirname(parametersPath);
    await mkdir(templateDir, { recursive: true });
    await writeFile(parametersPath, parametersContent);
  }
};
