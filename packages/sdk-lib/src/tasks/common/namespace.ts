/* istanbul ignore file */

import { ModuleHandler } from "../../utils/moduleHandler";
import { loadConfigNamespaces } from "../../utils/nextJs/config";
import { loadPageNamespaces } from "../../utils/nextJs/pages";
import { loadPublicAssetNamespaces } from "../../utils/nextJs/publicAssets";
import { loadParameterNamespaces } from "../../utils/parameters/namespace";
import { loadHttpApiNamespaces } from "../../utils/serverless/namespace";

export const loadAndResolveNamespaces = async (
  dir: string,
  ui: boolean,
  serverless: boolean
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);

  const namespaces = await moduleHandler.getNamespaces(async module => {
    const loadNamespacePromises: Promise<void>[] = [
      loadParameterNamespaces(module)
    ];
    if (ui) {
      loadNamespacePromises.push(loadConfigNamespaces(module));
      loadNamespacePromises.push(loadPageNamespaces(module));
      loadNamespacePromises.push(loadPublicAssetNamespaces(module));
    }
    if (serverless) {
      loadNamespacePromises.push(loadHttpApiNamespaces(module));
    }
    await Promise.all(loadNamespacePromises);
  });

  return namespaces;
};
