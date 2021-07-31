import { execSync } from "child_process";

export const eslint = async (dir: string): Promise<void> => {
  try {
    execSync(`npx eslint ./ --no-error-on-unmatched-pattern`, {
      cwd: dir,
      windowsHide: true,
      stdio: "pipe"
    });
  } catch (e) {
    throw new Error(e.message);
  }
};
