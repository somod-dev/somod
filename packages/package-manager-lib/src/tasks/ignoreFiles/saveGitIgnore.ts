import { join } from "path";
import { file_gitIgnore } from "../../utils/constants";
import { saveIgnoreFileStore } from "@sodaru-cli/base";

export const saveGitIgnore = async (dir: string): Promise<void> => {
  const gitIgnorePath = join(dir, file_gitIgnore);
  await saveIgnoreFileStore(gitIgnorePath);
};
