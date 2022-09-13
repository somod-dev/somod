/* istanbul ignore file */

import { childProcess } from "@solib/cli-base";

export const samDeploy = async (
  dir: string,
  verbose = false,
  guided = false
): Promise<void> => {
  await childProcess(
    dir,
    process.platform === "win32" ? "sam.cmd" : "sam",
    ["build"],
    { show: verbose ? "on" : "error", return: "off" },
    { show: verbose ? "on" : "error", return: "off" }
  );

  const deployArgs = ["deploy"];
  if (guided) {
    deployArgs.push("--guided");
  }

  await childProcess(
    dir,
    process.platform === "win32" ? "sam.cmd" : "sam",
    deployArgs,
    { show: verbose || guided ? "on" : "error", return: "off" },
    { show: verbose || guided ? "on" : "error", return: "off" }
  );
};
