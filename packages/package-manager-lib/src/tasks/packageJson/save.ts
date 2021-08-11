import { join } from "path";
import { file_packageJson } from "../../utils/constants";
import { saveJsonFileStore } from "@sodaru-cli/base";

export const save = async (dir: string): Promise<void> => {
  const packageJsonPath = join(dir, file_packageJson);
  await saveJsonFileStore(packageJsonPath);
};
