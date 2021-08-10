import { file_index_dts, key_typings, path_build } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setTypings = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_typings] = `${path_build}/${file_index_dts}`;
  update(dir, packageJson);
};
