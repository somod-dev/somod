/* istanbul ignore file */

import { childProcess } from "@solib/cli-base";

export const sodev = async (dir: string, command: string): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "npx.cmd" : "npx", [
    "sodev",
    command
  ]);
};
