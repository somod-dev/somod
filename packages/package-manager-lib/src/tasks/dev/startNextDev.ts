import { spawn } from "child_process";

export const startNextDev = (dir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["next", "dev"],
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
