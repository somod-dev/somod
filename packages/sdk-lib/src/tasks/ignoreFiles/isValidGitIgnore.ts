import { file_gitIgnore } from "../../utils/constants";
import { validate } from "../../utils/ignoreFile";

export const isValidGitIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await validate(dir, paths, file_gitIgnore);
};
