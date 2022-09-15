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
  somodVersion: string | null,
  somodPlugins: (string | { name: string; version: string })[]
) => {
  const somodPluginWithVersion = somodPlugins.map(p => {
    return typeof p == "string" ? p : `${p.name}@${p.version}`;
  });

  const somodPluginNames = somodPlugins.map(p => {
    return typeof p == "string" ? p : p.name;
  });

  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
      "install",
      somodName + (somodVersion ? "@" + somodVersion : ""),
      ...somodPluginWithVersion,
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
  if (somodPluginNames.length > 0) {
    packageJson.somodPlugins = somodPluginNames;
  }
  updateJsonFileStore(packageJsonPath, packageJson);
  await saveJsonFileStore(packageJsonPath);
};
