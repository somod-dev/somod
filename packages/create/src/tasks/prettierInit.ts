import { join } from "path";
import { childProcess } from "nodejs-cli-runner";
import {
  readJsonFileStore,
  updateJsonFileStore,
  saveJsonFileStore
} from "nodejs-file-utils";
import { writeFile } from "fs/promises";

export const prettierInit = async (
  dir: string,
  verbose: boolean,
  prettierIgnoreList: string[]
) => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["install", "prettier-config-sodaru", "--save-dev"],
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );

  await writeFile(join(dir, ".prettierignore"), prettierIgnoreList.join("\n"));

  const packageJsonPath = join(dir, "package.json");
  const packageJson = await readJsonFileStore(packageJsonPath, true);

  const scripts = {
    prettier:
      "npx prettier --check --ignore-unknown --no-error-on-unmatched-pattern ./**/*"
  };
  if (packageJson.scripts?.["prebuild"]) {
    scripts["prebuild"] =
      packageJson.scripts?.["prebuild"] + " && " + "npm run prettier";
    delete packageJson.scripts?.["prebuild"];
  } else {
    scripts["prebuild"] = "npm run prettier";
  }

  packageJson.scripts = {
    ...scripts,
    ...(packageJson.scripts as Record<string, string>)
  };

  packageJson.prettier = "prettier-config-sodaru";
  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};
