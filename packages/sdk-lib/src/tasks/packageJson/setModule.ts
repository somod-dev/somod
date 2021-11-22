import { file_index_js, key_module, path_build } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setModule = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_module] = `${path_build}/${file_index_js}`;
  update(dir, packageJson);
};
