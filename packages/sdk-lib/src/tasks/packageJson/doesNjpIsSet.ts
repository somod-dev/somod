import { key_njp, cli_version_regex } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesNjpIsSet = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (!cli_version_regex.test(packageJson[key_njp] as string)) {
    throw new Error(
      `${key_njp} must match '${cli_version_regex}' pattern in ${packageJsonPath(
        dir
      )}`
    );
  }
};
