import { join } from "path";
import { file_eslintIgnore } from "../../utils/constants";
import { saveIgnoreFileStore } from "@sodaru-cli/base";

export const saveEslintIgnore = async (dir: string): Promise<void> => {
  const eslintIgnorePath = join(dir, file_eslintIgnore);
  await saveIgnoreFileStore(eslintIgnorePath);
};
