import { file_eslintIgnore } from "../../utils/constants";
import { validate } from "../../utils/ignoreFile";

export const isValidEslintIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await validate(dir, paths, file_eslintIgnore);
};
