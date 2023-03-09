import { existsSync } from "fs";
import { join } from "path";
import {
  Extension,
  ExtensionValue,
  IExtensionHandler,
  IModuleHandler
} from "somod-types";
import { file_extensionJs, path_build } from "../constants";

const loadExtension = async (pluginModule: string): Promise<Extension> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { default: _default, ...exports } = await import(pluginModule);
  return exports;
};

const loadExtensions = async (
  moduleHandler: IModuleHandler
): Promise<{ name: string; extension: Extension }[]> => {
  const modules = moduleHandler.list;

  const extensionsInModules = await Promise.all(
    modules.map(async moduleNode => {
      const extensionFilePath = join(
        moduleNode.module.packageLocation,
        path_build,
        file_extensionJs
      );
      if (!moduleNode.module.root && existsSync(extensionFilePath)) {
        const extension = await loadExtension(extensionFilePath);
        return { name: moduleNode.module.name, extension };
      }
    })
  );

  const extensions = extensionsInModules.filter(e => !!e).reverse();

  return extensions;
};

export class ExtensionHandler implements IExtensionHandler {
  private static instance: IExtensionHandler;
  private extensions: { name: string; extension: Extension }[] = [];

  private constructor() {
    // do nothing
  }

  public static async getInstance(
    moduleHandler: IModuleHandler
  ): Promise<IExtensionHandler> {
    if (this.instance === undefined) {
      const handler = new ExtensionHandler();

      handler.extensions = await loadExtensions(moduleHandler);

      this.instance = handler;
    }
    return this.instance;
  }

  get prebuildHooks() {
    return this.get<Extension["prebuild"]>("prebuild");
  }
  get buildHooks() {
    return this.get<Extension["build"]>("build");
  }
  get preprepareHooks() {
    return this.get<Extension["preprepare"]>("preprepare");
  }
  get prepareHooks() {
    return this.get<Extension["prepare"]>("prepare");
  }
  get namespaceLoaders() {
    return this.get<Extension["namespaceLoader"]>("namespaceLoader");
  }
  get uiConfigKeywords() {
    return this.get<Extension["uiConfigKeywords"]>("uiConfigKeywords");
  }
  get serverlessTemplateKeywords() {
    return this.get<Extension["serverlessTemplateKeywords"]>(
      "serverlessTemplateKeywords"
    );
  }
  get functionLayers() {
    return this.get<Extension["functionLayers"]>("functionLayers");
  }
  get functionMiddlewares() {
    return this.get<Extension["functionMiddlewares"]>("functionMiddlewares");
  }
  get<T>(key: string): ExtensionValue<T>[] {
    return this.extensions
      .map(extension => {
        return {
          extension: extension.name,
          value: extension.extension[key] as T
        };
      })
      .filter(e => e.value !== undefined);
  }
}
