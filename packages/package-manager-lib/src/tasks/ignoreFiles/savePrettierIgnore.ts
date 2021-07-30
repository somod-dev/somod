import { join } from "path";
import { file_prettierIgnore } from "../../utils/constants";
import { save as saveJson } from "../../utils/ignoreFileStore";

export const savePrettierIgnore = async (dir: string): Promise<void> => {
  const prettierIgnorePath = join(dir, file_prettierIgnore);
  await saveJson(prettierIgnorePath);
};
