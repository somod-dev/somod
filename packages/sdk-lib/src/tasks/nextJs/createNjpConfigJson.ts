import { writeFile } from "fs/promises";
import { join } from "path";
import { file_njpConfigJson } from "../../utils/constants";

export const createNjpConfigJson = async (dir: string): Promise<void> => {
  await writeFile(join(dir, file_njpConfigJson), `{}\n`);
};
