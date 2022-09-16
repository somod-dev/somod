import { existsSync } from "fs";
import { join } from "path";
import { childProcess } from "nodejs-cli-runner";
import { writeFile } from "fs/promises";

export const gitInit = async (
  dir: string,
  verbose: boolean,
  gitIgnoreList: string[]
) => {
  if (!existsSync(join(dir, ".git"))) {
    await childProcess(
      dir,
      process.platform === "win32" ? "git.exe" : "git",
      ["init"],
      { show: verbose ? "on" : "error", return: "off" },
      { show: verbose ? "on" : "error", return: "off" }
    );
  }

  await writeFile(join(dir, ".gitignore"), gitIgnoreList.join("\n"));
};
