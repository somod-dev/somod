import { file_vercelIgnore } from "../../utils/constants";
import { update } from "../../utils/ignoreFile";

export const updateVercelIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await update(dir, paths, file_vercelIgnore);
};
