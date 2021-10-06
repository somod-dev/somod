import { childProcess } from "@sodaru-cli/base";
import { key_moduleAwsLambdaTypes } from "../../utils/constants";

export const installAwsLambdaTypesAsDevDependency = async (
  dir: string
): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "npm.cmd" : "npm", [
    "i",
    key_moduleAwsLambdaTypes,
    "--save-dev"
  ]);
};
