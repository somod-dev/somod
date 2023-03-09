import { copyFile } from "fs/promises";
import { copyDirectory } from "nodejs-file-utils";
import { join } from "path";

export const createTemplateFiles = async (
  dir: string,
  serverless: boolean,
  ui: boolean
) => {
  const templatePath = join(dir, "node_modules/somod-template");

  await copyDirectory(join(templatePath, "lib"), join(dir, "lib"));
  await copyFile(
    join(templatePath, "parameters.yaml"),
    join(dir, "parameters.yaml")
  );
  await copyFile(
    join(templatePath, "tsconfig.somod.json"),
    join(dir, "tsconfig.somod.json")
  );
  if (serverless) {
    await copyDirectory(
      join(templatePath, "serverless"),
      join(dir, "serverless")
    );
  }
  if (ui) {
    await copyDirectory(join(templatePath, "ui"), join(dir, "ui"));
  }
};
