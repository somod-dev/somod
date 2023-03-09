import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { build } from "../../utils/serverless/serverlessTemplate/build";

export const buildServerlessTemplate = async (context: IContext) => {
  const templatePath = join(context.dir, path_serverless, file_templateYaml);
  if (existsSync(templatePath)) {
    await build(context.dir);
  }
};
