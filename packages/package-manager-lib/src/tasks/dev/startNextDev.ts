import { exec } from "child_process";

export const startNextDev = (dir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const childProcess = exec(
      `npx next dev`,
      {
        cwd: dir,
        windowsHide: true
      },
      error => {
        if (error) {
          reject();
        } else {
          resolve();
        }
      }
    );
    childProcess.stdout.on("data", chunk => {
      process.stdout.write(chunk);
    });
    childProcess.stderr.on("data", chunk => {
      process.stderr.write(chunk);
    });
  });
};
