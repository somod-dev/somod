import { join } from "path";
import { file_tsConfigBuildJson } from "../../utils/constants";
import { saveJsonFileStore } from "@sodaru-cli/base";

export const save = async (dir: string): Promise<void> => {
  const tsConfigBuildPath = join(dir, file_tsConfigBuildJson);
  await saveJsonFileStore(tsConfigBuildPath);
};
