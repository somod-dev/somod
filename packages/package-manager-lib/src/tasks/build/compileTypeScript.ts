import { childProcess } from "@sodaru-cli/base";
import { file_tsConfigBuildJson } from "../../utils/constants";

export const compileTypeScript = async (
  dir: string,
  noEmit = false
): Promise<void> => {
  const args = ["tsc", "--project", file_tsConfigBuildJson];
  if (noEmit) {
    args.push("--noEmit");
  }
  try {
    await childProcess(
      dir,
      process.platform === "win32" ? "npx.cmd" : "npx",
      args,
      true,
      true
    );
  } catch (e) {
    // e is of type { stdout?: string; stderr?: string }
    if (
      !(e.stdout as string)?.startsWith(
        "error TS18003: No inputs were found in config file"
      )
    ) {
      throw e;
    }
  }
};
