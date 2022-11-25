/* istanbul ignore file */

import { NamespaceLoader } from "somod-types";
import { ModuleHandler } from "../../utils/moduleHandler";

export const appendNamespaceLoaders = async (loaders: NamespaceLoader[]) => {
  ModuleHandler.appendNamespaceLoaders(loaders);
};
