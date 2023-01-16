/* istanbul ignore file */

import { childProcess } from "nodejs-cli-runner";
import { IContext } from "somod-types";

export const samDeploy = async (
  context: IContext,
  verbose = false,
  guided = false
): Promise<void> => {
  await childProcess(
    context.dir,
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
    context.dir,
    process.platform === "win32" ? "sam.cmd" : "sam",
    deployArgs,
    { show: verbose || guided ? "on" : "error", return: "off" },
    { show: verbose || guided ? "on" : "error", return: "off" }
  );
};
