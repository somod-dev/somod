import { file_gitIgnore } from "../../utils/constants";
import { update } from "../../utils/ignoreFile";

export const updateGitIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await update(dir, paths, file_gitIgnore);
};
