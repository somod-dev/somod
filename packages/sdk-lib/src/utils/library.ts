import { join } from "path";
import { readJsonFileStore } from "@sodaru/cli-base";
import { file_packageJson, path_nodeModules } from "../utils/constants";
import { existsSync } from "fs";

type CommonLib = {
  name: string;
  version: string;
  libraries: Record<string, string>;
};

// TODO: TO BE REMOVED this function is a temporary mock inplace for testing purposes only
const _getToBeBundledLibraries = async (
  dir: string,
  packageType: "njp" | "slp" | "common"
): Promise<CommonLib> => {
  const somodScopePath = join(dir, path_nodeModules, "@somod");
  const njpPath = join(somodScopePath, "njp");
  const slpPath = join(somodScopePath, "slp");
  const somodPath = join(somodScopePath, "somod");
  let packageJson: Record<string, unknown> = { version: "1.0.0" };
  if (existsSync(njpPath)) {
    packageJson = await readJsonFileStore(join(njpPath, file_packageJson));
  } else if (existsSync(slpPath)) {
    packageJson = await readJsonFileStore(join(slpPath, file_packageJson));
  } else if (existsSync(somodPath)) {
    packageJson = await readJsonFileStore(join(somodPath, file_packageJson));
  }

  const lib: CommonLib = {
    name: "",
    version: packageJson.version as string,
    libraries: {}
  };

  if (packageType == "common") {
    lib.name = "@somod/common-lib";
    lib.libraries = {
      "@solib/common-types-schemas": "^1.0.0",
      "@solib/errors": "^1.0.0",
      "@solib/json-validator": "^1.0.0",
      lodash: "^4.17.21",
      tslib: "^2.3.1",
      uuid: "^8.3.2"
    };
  } else if (packageType == "njp") {
    lib.name = "@somod/njp-lib";
    lib.libraries = {
      next: "^12.0.7",
      react: "^17.0.2",
      "react-dom": "^17.0.2"
    };
  } else {
    lib.name = "@somod/slp-lib";
    lib.libraries = {
      "aws-sdk": "2.952.0"
    };
  }

  return lib;
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
