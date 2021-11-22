import { childProcess } from "@sodaru/cli-base";

export const isGitDirectory = async (dir: string): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "git.exe" : "git", [
    "status"
  ]);
};

export const gitInit = async (dir: string): Promise<void> => {
  await childProcess(dir, process.platform === "win32" ? "git.exe" : "git", [
    "init"
  ]);
};

export const git = async (dir: string): Promise<void> => {
  try {
    await isGitDirectory(dir);
  } catch (e) {
    await gitInit(dir);
  }
};
