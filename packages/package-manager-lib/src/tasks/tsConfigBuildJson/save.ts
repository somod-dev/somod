import { join } from "path";
import { file_tsConfigBuildJson } from "../../utils/constants";
import { save as saveJson } from "../../utils/jsonFileStore";

export const save = async (dir: string): Promise<void> => {
  const tsConfigBuildPath = join(dir, file_tsConfigBuildJson);
  await saveJson(tsConfigBuildPath);
};
