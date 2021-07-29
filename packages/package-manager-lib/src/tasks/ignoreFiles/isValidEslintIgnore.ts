import { file_eslintIgnore } from "../../utils/constants";
import validateIgnoreFile from "../../utils/validateIgnoreFile";

export const isValidEslintIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await validateIgnoreFile(dir, paths, file_eslintIgnore);
};
