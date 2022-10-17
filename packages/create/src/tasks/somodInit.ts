import { join } from "path";
import { childProcess } from "nodejs-cli-runner";
import {
  readJsonFileStore,
  updateJsonFileStore,
  saveJsonFileStore
} from "nodejs-file-utils";

export const somodInit = async (
  dir: string,
  verbose: boolean,
  somodName: string,
  somodVersion: string | null
) => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "install",
      somodName + (somodVersion ? "@" + somodVersion : ""),
      "--save-dev"
    ],
    { show: verbose ? "on" : "error", return: "off" },
    { show: verbose ? "on" : "error", return: "off" }
  );

  const packageLockJson = await readJsonFileStore(
    join(dir, "package-lock.json"),
    true
  );
  const packageJsonPath = join(dir, "package.json");
  const packageJson = await readJsonFileStore(packageJsonPath, true);
  packageJson.somod =
    packageLockJson["packages"]["node_modules/" + somodName].version;

  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};
