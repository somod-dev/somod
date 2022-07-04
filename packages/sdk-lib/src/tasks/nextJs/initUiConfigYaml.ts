import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";

export const initUiConfigYaml = async (dir: string): Promise<void> => {
  const configPath = join(dir, path_ui, file_configYaml);

  const configContent = `# yaml-language-server: $schema=../node_modules/@somod/ui-config-schema/schemas/index.json

env: {}
imageDomains: []
publicRuntimeConfig: {}
serverRuntimeConfig: {}

`;

  if (!existsSync(configPath)) {
    const templateDir = dirname(configPath);
    await mkdir(templateDir, { recursive: true });
    await writeFile(configPath, configContent);
  }
};
