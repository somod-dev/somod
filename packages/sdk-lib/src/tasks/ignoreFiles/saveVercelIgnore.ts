import { file_vercelIgnore } from "../../utils/constants";
import { save } from "../../utils/ignoreFile";

export const saveVercelIgnore = async (dir: string): Promise<void> => {
  await save(dir, file_vercelIgnore);
};
