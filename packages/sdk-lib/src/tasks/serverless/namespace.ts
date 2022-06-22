import { ModuleHandler } from "../../utils/moduleHandler";
import { loadHttpApiNamespaces } from "../../utils/serverless";

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
          await loadHttpApiNamespaces(module);
        }
      ])
    )
  );

  return namespaces;
};
