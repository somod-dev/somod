import { execSync } from "child_process";
import { file_tsConfigBuildJson } from "../../utils/constants";

export const compileTypeScript = async (
  dir: string,
  noEmit = false
): Promise<void> => {
  const emit = noEmit ? "--noEmit" : "";
  try {
    execSync(`npx tsc --project ${file_tsConfigBuildJson} ${emit}`, {
      cwd: dir,
      windowsHide: true,
      stdio: "pipe"
    });
  } catch (e) {
    const message: string = e.stdout.toString();
    if (
      !message.startsWith("error TS18003: No inputs were found in config file")
    ) {
      throw new Error(e.message + "\n" + message);
    }
  }
};
