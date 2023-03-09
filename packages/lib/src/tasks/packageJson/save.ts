import { join } from "path";
import { file_packageJson } from "../../utils/constants";
import { saveJsonFileStore } from "nodejs-file-utils";
import { IContext } from "somod-types";

export const save = async (context: IContext): Promise<void> => {
  const packageJsonPath = join(context.dir, file_packageJson);
  await saveJsonFileStore(packageJsonPath);
};
