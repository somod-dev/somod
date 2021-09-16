import { spawn } from "child_process";

export const samCommand = (
  dir: string,
  action: "validate" | "build" | "deploy",
  guided = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const args: string[] = [action];
    if (action == "deploy" && guided) {
      args.push("--guided");
    }
    const childProcess = spawn(
      process.platform === "win32" ? "sam.cmd" : "sam",
      args,
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
