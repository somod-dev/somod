import { childProcess } from "@sodaru-cli/base";

export const prettier = async (dir: string, write = false): Promise<void> => {
  const args = [
    "prettier",
    write ? "--write" : "--check",
    "--ignore-unknown",
    "./**/*"
  ];
  await childProcess(
    dir,
    process.platform === "win32" ? "npx.cmd" : "npx",
    args
  );
};
