import { file_gitIgnore } from "../../utils/constants";
import validateIgnoreFile from "../../utils/validateIgnoreFile";

export const isValidGitIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await validateIgnoreFile(dir, paths, file_gitIgnore);
};
