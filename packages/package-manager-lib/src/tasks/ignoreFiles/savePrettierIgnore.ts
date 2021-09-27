import { file_prettierIgnore } from "../../utils/constants";
import { save } from "../../utils/ignoreFile";

export const savePrettierIgnore = async (dir: string): Promise<void> => {
  await save(dir, file_prettierIgnore);
};
