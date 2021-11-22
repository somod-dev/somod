import { file_eslintIgnore } from "../../utils/constants";
import { update } from "../../utils/ignoreFile";

export const updateEslintIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await update(dir, paths, file_eslintIgnore);
};
