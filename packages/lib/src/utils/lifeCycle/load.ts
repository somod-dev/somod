import { existsSync } from "fs";
import { join } from "path";
import { LifeCycle } from "somod-types";
import { file_lifeCycleJs, path_build } from "../constants";
import { ModuleHandler } from "../moduleHandler";

const loadLifeCycleHook = async (pluginModule: string): Promise<LifeCycle> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { default: _default, ...exports } = await import(pluginModule);
  return exports;
};

export const loadLifeCycleHooks = async (): Promise<
  { name: string; lifeCycle: LifeCycle }[]
> => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const modules = await moduleHandler.listModules();

  const lifeCycleHooksInModules = await Promise.all(
    modules.map(async moduleNode => {
      const lifeCycleFilePath = join(
        moduleNode.module.packageLocation,
        path_build,
        file_lifeCycleJs
      );
      if (!moduleNode.module.root && existsSync(lifeCycleFilePath)) {
        const lifeCycle = await loadLifeCycleHook(lifeCycleFilePath);
        return { name: moduleNode.module.name, lifeCycle };
      }
    })
  );

  const lifeCycleHooks = lifeCycleHooksInModules.filter(l => !!l).reverse();

  return lifeCycleHooks;
};
