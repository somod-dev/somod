import { file_prettierIgnore } from "../../utils/constants";
import { update } from "../../utils/ignoreFile";

export const updatePrettierIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await update(dir, paths, file_prettierIgnore);
};
