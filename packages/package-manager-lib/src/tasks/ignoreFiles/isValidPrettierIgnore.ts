import { file_prettierIgnore } from "../../utils/constants";
import { validate } from "../../utils/ignoreFile";

export const isValidPrettierIgnore = async (
  dir: string,
  paths: string[] = []
): Promise<void> => {
  await validate(dir, paths, file_prettierIgnore);
};
