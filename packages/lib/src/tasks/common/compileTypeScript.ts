import { existsSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import { childProcess, logWarning } from "nodejs-cli-runner";
import { join } from "path";
import { IContext } from "somod-types";
import {
  file_tsConfigSomodJson,
  path_serverless,
  path_ui
} from "../../utils/constants";
import { readJsonFileStore } from "nodejs-file-utils";

export const compileTypeScript = async (
  context: IContext,
  verbose = false
): Promise<void> => {
  if (existsSync(join(context.dir, file_tsConfigSomodJson))) {
    let tsConfigFileName: string = file_tsConfigSomodJson;
    if (
      (context.isUI && !context.isServerless) ||
      (!context.isUI && context.isServerless)
    ) {
      const tsConfig = (await readJsonFileStore(
        join(context.dir, file_tsConfigSomodJson)
      )) as { include?: string[] };

      const excludePath = context.isUI ? path_serverless : path_ui;

      const filteredInclude = (tsConfig.include || []).filter(
        i => !i.startsWith(excludePath)
      );
      if (tsConfig.include?.length > filteredInclude.length) {
        tsConfig.include = filteredInclude;

        tsConfigFileName =
          file_tsConfigSomodJson + "." + (context.isUI ? "ui" : "serverless");

        await writeFile(
          join(context.dir, tsConfigFileName),
          JSON.stringify(tsConfig, null, 2)
        );
      }
    }
    const args = ["tsc", "--project", tsConfigFileName];

    try {
      await childProcess(
        context.dir,
        process.platform === "win32" ? "npx.cmd" : "npx",
        args,
        { show: "off", return: "on" },
        { show: "off", return: "on" }
      );
    } finally {
      if (tsConfigFileName != file_tsConfigSomodJson) {
        unlink(join(context.dir, tsConfigFileName));
      }
    }
  } else {
    if (verbose) {
      logWarning(
        `Skipping TypeScript Compilation : ${file_tsConfigSomodJson} not Found.`
      );
    }
  }
};
