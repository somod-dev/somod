import { file_gitIgnore } from "../../utils/constants";
import { save } from "../../utils/ignoreFile";

export const saveGitIgnore = async (dir: string): Promise<void> => {
  await save(dir, file_gitIgnore);
};
