import { file_eslintIgnore } from "../../utils/constants";
import { save } from "../../utils/ignoreFile";

export const saveEslintIgnore = async (dir: string): Promise<void> => {
  await save(dir, file_eslintIgnore);
};
