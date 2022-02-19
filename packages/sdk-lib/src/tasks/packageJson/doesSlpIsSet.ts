import { key_slp, cli_version_regex } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesSlpIsSet = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (!cli_version_regex.test(packageJson[key_slp] as string)) {
    throw new Error(
      `${key_slp} must match '${cli_version_regex}' pattern in ${packageJsonPath(
        dir
      )}`
    );
  }
};
