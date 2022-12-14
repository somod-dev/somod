/* istanbul ignore file */

import { childProcess } from "nodejs-cli-runner";

export const nextCommand = async (
  dir: string,
  args: string[]
): Promise<void> => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", ...args],
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
