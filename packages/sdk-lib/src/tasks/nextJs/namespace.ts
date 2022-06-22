import { ModuleHandler } from "../../utils/moduleHandler";
import { loadConfigNamespaces } from "../../utils/nextJs/config";
import { loadPageNamespaces } from "../../utils/nextJs/pages";
import { loadPublicAssetNamespaces } from "../../utils/nextJs/publicAssets";

export const loadNamespaces = async (
  dir: string,
  moduleIndicators: string[]
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await moduleHandler.getNamespaces(
    Object.fromEntries(
      moduleIndicators.map(moduleType => [
        moduleType,
        async module => {
          await Promise.all([
            loadPageNamespaces(module),
            loadPublicAssetNamespaces(module),
            loadConfigNamespaces(module)
          ]);
        }
      ])
    )
  );

  return namespaces;
};
