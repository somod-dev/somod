import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { validateServerlessTemplate as _validateServerlessTemplate } from "../../utils/serverless/serverlessTemplate/validate";

export const validateServerlessTemplate = async (
  context: IContext
): Promise<void> => {
  const templateYamlPath = join(
    context.dir,
    path_serverless,
    file_templateYaml
  );
  if (existsSync(templateYamlPath)) {
    await _validateServerlessTemplate(context);
  }
};
