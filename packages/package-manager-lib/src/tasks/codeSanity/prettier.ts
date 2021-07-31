import { execSync } from "child_process";

export const prettier = async (dir: string, write = false): Promise<void> => {
  try {
    const action = write ? "--write" : "--check";
    execSync(`npx prettier ${action} --ignore-unknown ./**/*`, {
      cwd: dir,
      windowsHide: true,
      stdio: "pipe"
    });
  } catch (e) {
    throw new Error(e.message);
  }
};
