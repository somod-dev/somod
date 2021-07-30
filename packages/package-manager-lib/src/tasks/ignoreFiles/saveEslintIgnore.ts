import { join } from "path";
import { file_eslintIgnore } from "../../utils/constants";
import { save as saveJson } from "../../utils/ignoreFileStore";

export const saveEslintIgnore = async (dir: string): Promise<void> => {
  const eslintIgnorePath = join(dir, file_eslintIgnore);
  await saveJson(eslintIgnorePath);
};
