import { existsSync } from "fs";
import { dirname, join } from "path";
import {
  file_packageJson,
  key_main,
  key_somodPlugins,
  path_nodeModules
} from "../constants";
import { read } from "../packageJson";
import { Plugin } from "./types";

const resolvePluginPackage = (
  dir: string,
  moduleName: string
): string | undefined => {
  let moduleContainer = dir;
  let broke = false;
  while (
    !existsSync(
      join(moduleContainer, path_nodeModules, moduleName, file_packageJson)
    )
  ) {
    const parentDir = dirname(moduleContainer);
    if (parentDir == moduleContainer) {
      broke = true;
      break;
    }
    moduleContainer = parentDir;
  }
  return broke
    ? undefined
    : join(moduleContainer, path_nodeModules, moduleName);
};

const getPluginModuleLocation = async (dir: string, moduleName: string) => {
  let moduleLocation = resolvePluginPackage(dir, moduleName);
  if (!moduleLocation) {
    moduleLocation = resolvePluginPackage(__dirname, moduleName);
  }

  if (!moduleLocation) {
    throw new Error(
      `Unable to find plugin '${moduleName}', Make sure it is installed`
    );
  }

  const pluginPackageJson = await read(moduleLocation);
  const main = (pluginPackageJson[key_main] || "index.js") as string;

  return join(moduleLocation, main);
};

const loadPlugin = async (pluginModule: string): Promise<Plugin> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { default: _default, ...exports } = await import(pluginModule);
  return exports;
};

const cache: Record<string, { name: string; plugin: Plugin }[]> = {};

export const loadPlugins = async (
  dir: string
): Promise<{ name: string; plugin: Plugin }[]> => {
  if (!cache[dir]) {
    const packageJson = await read(dir);
    const pluginNames = packageJson[key_somodPlugins];
    if (pluginNames === undefined) {
      return [];
    }
    const plugins = await Promise.all(
      (pluginNames as string[]).map(async pluginName => {
        const pluginModuleLocation = await getPluginModuleLocation(
          dir,
          pluginName
        );
        return {
          name: pluginName,
          plugin: await loadPlugin(pluginModuleLocation)
        };
      })
    );

    cache[dir] = plugins;
  }

  return cache[dir];
};
