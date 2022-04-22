import { childProcess } from "@sodaru/cli-base";

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
