import { ModuleHandler } from "../../utils/moduleHandler";
import { loadConfigNamespaces } from "../../utils/nextJs/config";
import { loadPageNamespaces } from "../../utils/nextJs/pages";
import { loadPublicAssetNamespaces } from "../../utils/nextJs/publicAssets";
import { loadParameterNamespaces } from "../../utils/parameters/namespace";
import { loadHttpApiNamespaces } from "../../utils/serverless/namespace";

export const loadAndResolveNamespaces = async (dir: string) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);

  const namespaces = await moduleHandler.getNamespaces(async module => {
    await Promise.all([
      loadParameterNamespaces(module),
      loadConfigNamespaces(module),
      loadPageNamespaces(module),
      loadPublicAssetNamespaces(module),
      loadHttpApiNamespaces(module)
    ]);
  });

  return namespaces;
};
