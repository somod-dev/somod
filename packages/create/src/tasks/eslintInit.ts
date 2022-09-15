import { join } from "path";
import { childProcess } from "nodejs-cli-runner";
import { writeFile } from "fs/promises";
import {
  readJsonFileStore,
  updateJsonFileStore,
  saveJsonFileStore
} from "nodejs-file-utils";

export const eslintInit = async (
  dir: string,
  verbose: boolean,
  eslintIgnoreList: string[]
) => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["install", "eslint-config-sodaru", "eslint-config-next", "--save-dev"],
    { show: verbose ? "on" : "error", return: "off" },
    { show: verbose ? "on" : "error", return: "off" }
  );

  await writeFile(join(dir, ".eslintignore"), eslintIgnoreList.join("\n"));

  const packageJsonPath = join(dir, "package.json");
  const packageJson = await readJsonFileStore(packageJsonPath, true);

  const scripts = { eslint: "npx eslint ./ --no-error-on-unmatched-pattern" };
  if (packageJson.scripts?.["prebuild"]) {
    scripts["prebuild"] =
      packageJson.scripts?.["prebuild"] + " && " + "npm run eslint";
    delete packageJson.scripts?.["prebuild"];
  } else {
    scripts["prebuild"] = "npm run eslint";
  }

  packageJson.scripts = {
    ...scripts,
    ...(packageJson.scripts as Record<string, string>)
  };

  packageJson.eslintConfig = {
    extends: ["sodaru", "next"]
  };
  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};
