import { key_files, path_build } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesFilesHasBuild = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (
    !(
      packageJson[key_files] &&
      (packageJson[key_files] as string[]).includes(path_build)
    )
  ) {
    throw new Error(
      `${key_files} must include ${path_build} in ${packageJsonPath(dir)}`
    );
  }
};
