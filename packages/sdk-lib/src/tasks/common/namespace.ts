import { ModuleType } from "../../utils/constants";
import { ModuleHandler, NamespaceLoader } from "../../utils/moduleHandler";
import { loadConfigNamespaces } from "../../utils/nextJs/config";
import { loadPageNamespaces } from "../../utils/nextJs/pages";
import { loadPublicAssetNamespaces } from "../../utils/nextJs/publicAssets";
import { loadParameterNamespaces } from "../../utils/parameters/namespace";
import { loadHttpApiNamespaces } from "../../utils/serverless";

const loaderMap: Record<ModuleType, NamespaceLoader> = {
  njp: async module => {
    await Promise.all([
      loadParameterNamespaces(module),
      loadConfigNamespaces(module),
      loadPageNamespaces(module),
      loadPublicAssetNamespaces(module)
    ]);
  },
  slp: async module => {
    await Promise.all([
      loadParameterNamespaces(module),
      loadHttpApiNamespaces(module)
    ]);
  },
  somod: async module => {
    await Promise.all([
      loadParameterNamespaces(module),
      loadConfigNamespaces(module),
      loadPageNamespaces(module),
      loadPublicAssetNamespaces(module),
      loadHttpApiNamespaces(module)
    ]);
  }
};

export const loadAndResolveNamespaces = async (
  dir: string,
  moduleIndicators: ModuleType[]
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await moduleHandler.getNamespaces(
    Object.fromEntries(moduleIndicators.map(mt => [mt, loaderMap[mt]]))
  );

  return namespaces;
};
