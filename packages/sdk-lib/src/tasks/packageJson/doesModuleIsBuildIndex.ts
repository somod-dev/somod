import { key_module, path_build, file_index_js } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesModuleIsBuildIndex = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  const moduleValue = `${path_build}/${file_index_js}`;

  if (packageJson[key_module] != moduleValue) {
    throw new Error(
      `${key_module} must be '${moduleValue}' in ${packageJsonPath(dir)}`
    );
  }
};
