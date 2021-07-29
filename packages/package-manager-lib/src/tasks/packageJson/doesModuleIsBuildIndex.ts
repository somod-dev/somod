import { key_module, path_build, file_index_js } from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const doesModuleIsBuildIndex = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  const moduleValue = `${path_build}/${file_index_js}`;

  if (packageJson[key_module] != moduleValue) {
    throw new Error(
      `${key_module} must be '${moduleValue}' in ${packageJsonPath(dir)}`
    );
  }
};
