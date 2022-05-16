/* istanbul ignore file */

import { childProcess } from "@solib/cli-base";

export const startNextDev = async (dir: string): Promise<void> => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev"],
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
