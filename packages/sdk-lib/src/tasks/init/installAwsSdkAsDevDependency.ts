import { childProcess } from "@sodaru/cli-base";
import {
  key_moduleAwsSdk,
  key_moduleAwsSdkVersion
} from "../../utils/constants";

export const installAwsSdkAsDevDependency = async (
  dir: string
): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "npm.cmd" : "npm", [
    "i",
    key_moduleAwsSdk + "@" + key_moduleAwsSdkVersion,
    "--save-dev",
    "--save-exact"
  ]);
};
