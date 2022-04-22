import { childProcess } from "@sodaru/cli-base";

export const buildNextJs = async (dir: string): Promise<void> => {
  await childProcess(
    dir,
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "build"],
    { show: "on", return: "off" },
    { show: "on", return: "off" }
  );
};
