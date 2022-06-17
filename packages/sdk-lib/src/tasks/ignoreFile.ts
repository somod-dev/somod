import { save, update } from "../utils/ignoreFile";

export const saveEslintIgnore = async (
  dir: string,
  ignoreFile: string
): Promise<void> => {
  await save(dir, ignoreFile);
};

export const updateEslintIgnore = async (
  dir: string,
  ignoreFile: string,
  paths: string[] = []
): Promise<void> => {
  await update(dir, paths, ignoreFile);
};
