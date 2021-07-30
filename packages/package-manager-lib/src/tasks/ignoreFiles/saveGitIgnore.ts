import { join } from "path";
import { file_gitIgnore } from "../../utils/constants";
import { save as saveJson } from "../../utils/ignoreFileStore";

export const saveGitIgnore = async (dir: string): Promise<void> => {
  const gitIgnorePath = join(dir, file_gitIgnore);
  await saveJson(gitIgnorePath);
};
