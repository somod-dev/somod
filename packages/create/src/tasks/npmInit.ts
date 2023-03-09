import { childProcess } from "nodejs-cli-runner";

export const npmInit = async (
  dir: string,
  verbose: boolean,
  prompt: boolean
) => {
  const args = [];
  if (!prompt) {
    args.push("--yes");
  }
  await childProcess(
    dir,
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["init", ...args],
    { show: prompt || verbose ? "on" : "error", return: "off" },
    { show: prompt || verbose ? "on" : "error", return: "off" }
  );
};
