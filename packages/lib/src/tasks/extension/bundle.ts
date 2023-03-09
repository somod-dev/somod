import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_extensionTs } from "../../utils/constants";
import { bundle } from "../../utils/extension/bundle";

export const bundleExtension = async (context: IContext, verbose = false) => {
  const extensionFilePath = join(context.dir, file_extensionTs);
  if (existsSync(extensionFilePath)) {
    await bundle(context, verbose);
  }
};
