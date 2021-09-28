import { ErrorSet } from "@sodaru-cli/base";
import { existsSync } from "fs";
import { isPlainObject } from "lodash";
import { join } from "path";
import {
  key_peerDependencies,
  key_devDependencies,
  key_moduleAwsSdk,
  key_moduleAwsSdkVersion,
  path_slpWorkingDir,
  path_functions
} from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesAwsSdkIsRightVersion = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  const errors: Error[] = [];

  const functionsExistsInWorkingDir = existsSync(
    join(dir, path_slpWorkingDir, path_functions)
  );

  [key_devDependencies, key_peerDependencies].forEach(dependencies => {
    const awsSdkVersion: string | null = isPlainObject(
      packageJson[dependencies]
    )
      ? packageJson[dependencies][key_moduleAwsSdk]
      : null;

    if (functionsExistsInWorkingDir && awsSdkVersion == null) {
      errors.push(
        new Error(
          `${key_moduleAwsSdk} must be installed as ${dependencies} in ${packageJsonPath(
            dir
          )}`
        )
      );
    }

    if (awsSdkVersion && awsSdkVersion != key_moduleAwsSdkVersion) {
      errors.push(
        new Error(
          `${dependencies}.${key_moduleAwsSdk} must be ${key_moduleAwsSdkVersion} in ${packageJsonPath(
            dir
          )}`
        )
      );
    }
  });

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
