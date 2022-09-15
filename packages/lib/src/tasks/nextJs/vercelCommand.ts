/* istanbul ignore file */

import { childProcess } from "nodejs-cli-runner";

export const vercelCommand = async (
  dir: string,
  args: string[]
): Promise<void> => {
  await childProcess(
    dir,
    process.platform === "win32" ? "vercel.cmd" : "vercel",
    args,
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
