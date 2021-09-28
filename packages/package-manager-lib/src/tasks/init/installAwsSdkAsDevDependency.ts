import { spawn } from "child_process";
import {
  key_moduleAwsSdk,
  key_moduleAwsSdkVersion
} from "../../utils/constants";

export const installAwsSdkAsDevDependency = (dir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      [
        "i",
        key_moduleAwsSdk + "@" + key_moduleAwsSdkVersion,
        "--save-dev",
        "--save-exact"
      ],
      {
        cwd: dir,
        windowsHide: true,
        stdio: "inherit"
      }
    );
    childProcess.on("error", e => {
      reject(e);
    });
    childProcess.on("close", () => {
      resolve();
    });
  });
};
