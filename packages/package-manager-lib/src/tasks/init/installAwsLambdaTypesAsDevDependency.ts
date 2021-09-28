import { spawn } from "child_process";
import { key_moduleAwsLambdaTypes } from "../../utils/constants";

export const installAwsLambdaTypesAsDevDependency = (
  dir: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["i", key_moduleAwsLambdaTypes, "--save-dev"],
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
