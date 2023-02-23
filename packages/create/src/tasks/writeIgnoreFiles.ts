import { writeFile } from "fs/promises";
import { join } from "path";

export const writeIgnoreFiles = async (
  dir: string,
  serverless: boolean,
  ui: boolean,
  eslint: boolean,
  prettier: boolean
) => {
  const ignoreFiles = ["node_modules", ".somod", "/build", "/parameters.json"];
  if (serverless) {
    ignoreFiles.push(".aws-sam", "samconfig.toml", "/template.yaml");
  }
  if (ui) {
    ignoreFiles.push(
      ".next",
      "tsconfig.json",
      "/pages",
      "/public",
      "next-env.d.ts",
      ".env",
      "next.config.js"
    );
  }

  const ignoreContent = ignoreFiles.join("\n");

  await writeFile(join(dir, ".gitignore"), ignoreContent);
  if (eslint) {
    await writeFile(join(dir, ".eslintignore"), ignoreContent);
  }
  if (prettier) {
    await writeFile(join(dir, ".prettierignore"), ignoreContent);
  }
};
