import { join } from "path";
import { file_packageJson } from "../../utils/constants";
import { save as saveJson } from "../../utils/jsonFileStore";

export const save = async (dir: string): Promise<void> => {
  const packageJsonPath = join(dir, file_packageJson);
  await saveJson(packageJsonPath);
};
