import { join } from "path";
import { readJsonFileStore } from "@sodaru/cli-base";
import { file_packageJson, path_nodeModules } from "../utils/constants";

type CommonLib = {
  name: string;
  version: string;
  libraries: Record<string, string>;
};

const _getToBeBundledLibraries = async (
  dir: string,
  packageType: "njp" | "slp" | "common"
): Promise<CommonLib> => {
  const packageJsonPath = join(
    dir,
    path_nodeModules,
    "@somod",
    `${packageType}-lib`,
    file_packageJson
  );
  const packageJson = (await readJsonFileStore(packageJsonPath)) as {
    name: string;
    version: string;
    toBeBundled: string[];
    peerDependencies: Record<string, string>;
  };

  const toBeBundledLibraries: Record<string, string> = {};
  packageJson.toBeBundled.forEach(lib => {
    toBeBundledLibraries[lib] = packageJson.peerDependencies[lib];
  });

  return {
    name: packageJson.name,
    version: packageJson.version,
    libraries: toBeBundledLibraries
  };
};

export const getToBeBundledLibraries = async (
  dir: string,
  type: "njp" | "slp"
): Promise<Record<string, string>> => {
  const commonLibs = await _getToBeBundledLibraries(dir, "common");
  const libs = await _getToBeBundledLibraries(dir, type);
  const libraries = commonLibs.libraries;
  Object.keys(libs.libraries).forEach(lib => {
    libraries[lib] = libs.libraries[lib];
  });
  return libraries;
};
