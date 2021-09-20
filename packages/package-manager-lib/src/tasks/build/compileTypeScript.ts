import { spawn } from "child_process";
import { file_tsConfigBuildJson } from "../../utils/constants";

export const compileTypeScript = (
  dir: string,
  noEmit = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args = ["tsc", "--project", file_tsConfigBuildJson];
    if (noEmit) {
      args.push("--noEmit");
    }
    let out = "";
    const childProcess = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      args,
      {
        cwd: dir,
        windowsHide: true,
        stdio: "pipe"
      }
    );
    childProcess.on("error", e => {
      reject(e);
    });
    childProcess.on("close", code => {
      if (
        code != 0 &&
        !out.startsWith("error TS18003: No inputs were found in config file")
      ) {
        reject(new Error(out));
      } else {
        resolve();
      }
    });
    childProcess.stdout.on("data", chunk => {
      out += chunk;
    });
    childProcess.stderr.on("data", chunk => {
      out += chunk;
    });
  });
};
