/* istanbul ignore file */

import { ModuleHandler } from "../../utils/moduleHandler";

export const loadNamespaces = async () => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await moduleHandler.getNamespaces();
};
