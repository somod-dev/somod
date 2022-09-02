import { join } from "path";
import { file_tsConfigSomodJson } from "../../utils/constants";
import { saveJsonFileStore } from "@solib/cli-base";

export const save = async (dir: string): Promise<void> => {
  const tsConfigSomodPath = join(dir, file_tsConfigSomodJson);
  await saveJsonFileStore(tsConfigSomodPath);
};
