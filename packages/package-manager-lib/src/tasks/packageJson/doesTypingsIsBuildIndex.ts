import { path_build, file_index_dts, key_typings } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesTypingsIsBuildIndex = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  const typingsValue = `${path_build}/${file_index_dts}`;

  if (packageJson[key_typings] != typingsValue) {
    throw new Error(
      `${key_typings} must be '${typingsValue}' in ${packageJsonPath(dir)}`
    );
  }
};
