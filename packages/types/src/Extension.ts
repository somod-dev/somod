import { IContext } from "./Context";
import { KeywordDefinition } from "./KeywordDefinition";
import { NamespaceLoader } from "./Namespace";

type Hook = (context: IContext) => Promise<void>;

type ExtensionFunctionLayer = { layer: string; allowedTypes: string[] };
type ExtensionFunctionMiddleware = {
  middleware: string;
  allowedTypes: string[];
};

export type Extension = {
  prebuild?: Hook;
  build?: Hook;
  preprepare?: Hook;
  prepare?: Hook;

  namespaceLoader?: NamespaceLoader;
  uiConfigKeywords?: KeywordDefinition[];
  serverlessTemplateKeywords?: KeywordDefinition[];

  functionLayers?: ExtensionFunctionLayer[];
  functionMiddlewares?: ExtensionFunctionMiddleware[];
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

  get functionLayers(): ExtensionValue<ExtensionFunctionLayer[]>[];
  get functionMiddlewares(): ExtensionValue<ExtensionFunctionMiddleware[]>[];

  get<T>(key: string): ExtensionValue<T>[];
}
