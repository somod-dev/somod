import { IContext } from "./Context";
import { KeywordDefinition } from "./KeywordDefinition";
import { NamespaceLoader } from "./Namespace";

type Hook = (context: IContext) => Promise<void>;

export type Extension = {
  prebuild?: Hook;
  build?: Hook;
  preprepare?: Hook;
  prepare?: Hook;

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

export interface IExtensionHandler {
  get prebuildHooks(): ExtensionValue<Hook>[];
  get buildHooks(): ExtensionValue<Hook>[];
  get preprepareHooks(): ExtensionValue<Hook>[];
  get prepareHooks(): ExtensionValue<Hook>[];

  get namespaceLoaders(): ExtensionValue<NamespaceLoader>[];
  get uiConfigKeywords(): ExtensionValue<KeywordDefinition[]>[];
  get serverlessTemplateKeywords(): ExtensionValue<KeywordDefinition[]>[];

  get functionLayers(): ExtensionValue<string[]>[];
  get functionMiddlewares(): ExtensionValue<string[]>[];

  get<T>(key: string): ExtensionValue<T>[];
}
