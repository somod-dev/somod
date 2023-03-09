import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_tsConfigSomodJson } from "../../utils/constants";
import { validate } from "../../utils/tsConfigSomodJson";

export const isValid = async (context: IContext): Promise<void> => {
  const tsConfigPath = join(context.dir, file_tsConfigSomodJson);
  if (existsSync(tsConfigPath)) {
    await validate(context);
  }
};
