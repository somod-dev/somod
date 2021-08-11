import { join } from "path";
import { file_prettierIgnore } from "../../utils/constants";
import { saveIgnoreFileStore } from "@sodaru-cli/base";

export const savePrettierIgnore = async (dir: string): Promise<void> => {
  const prettierIgnorePath = join(dir, file_prettierIgnore);
  await saveIgnoreFileStore(prettierIgnorePath);
};
