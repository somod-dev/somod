import { childProcess } from "@sodaru/cli-base";

export const eslint = async (dir: string): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "npx.cmd" : "npx", [
    "eslint",
    "./",
    "--no-error-on-unmatched-pattern"
  ]);
};
