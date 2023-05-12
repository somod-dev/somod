import { IContext } from "./Context";
import { KeywordDefinition } from "./KeywordDefinition";
import { NamespaceLoader } from "./Namespace";

export type LifecycleHook = (context: IContext) => Promise<void>;

export type Extension = {
  prebuild?: LifecycleHook;
  build?: LifecycleHook;
  preprepare?: LifecycleHook;
  prepare?: LifecycleHook;

  namespaceLoader?: NamespaceLoader;
  uiConfigKeywords?: KeywordDefinition[];
  serverlessTemplateKeywords?: KeywordDefinition[];

  functionLayers?: string[];
  functionMiddlewares?: string[];
};

export type ExtensionValue<T> = {
  extension: string;
  value: T;
};

/**
 * Interface for handling the extensions, all getters return the values ordered from child to parent module
 */
export interface IExtensionHandler {
  get prebuildHooks(): ExtensionValue<LifecycleHook>[];
  get buildHooks(): ExtensionValue<LifecycleHook>[];
  get preprepareHooks(): ExtensionValue<LifecycleHook>[];
  get prepareHooks(): ExtensionValue<LifecycleHook>[];

  get namespaceLoaders(): ExtensionValue<NamespaceLoader>[];
  get uiConfigKeywords(): ExtensionValue<KeywordDefinition[]>[];
  get serverlessTemplateKeywords(): ExtensionValue<KeywordDefinition[]>[];

  get functionLayers(): ExtensionValue<string[]>[];
  get functionMiddlewares(): ExtensionValue<string[]>[];

  get<T>(key: string): ExtensionValue<T>[];
}
