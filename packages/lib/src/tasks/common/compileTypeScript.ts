import { existsSync } from "fs";
import { childProcess, logWarning } from "nodejs-cli-runner";
import { join } from "path";
import { IContext } from "somod-types";
import { file_tsConfigSomodJson } from "../../utils/constants";

export const compileTypeScript = async (
  context: IContext,
  verbose = false
): Promise<void> => {
  if (existsSync(join(context.dir, file_tsConfigSomodJson))) {
    const args = ["tsc", "--project", file_tsConfigSomodJson];

    await childProcess(
      context.dir,
      process.platform === "win32" ? "npx.cmd" : "npx",
      args,
      { show: "off", return: "on" },
      { show: "off", return: "on" }
    );
  } else {
    if (verbose) {
      logWarning(
        `Skipping TypeScript Compilation : ${file_tsConfigSomodJson} not Found.`
      );
    }
  }
};
