import { key_somod, cli_version_regex } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesSomodIsSet = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (!cli_version_regex.test(packageJson[key_somod] as string)) {
    throw new Error(
      `${key_somod} must match '${cli_version_regex}' pattern in ${packageJsonPath(
        dir
      )}`
    );
  }
};
