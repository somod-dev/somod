import { IModuleHandler } from "./Module";
import { IServerlessTemplateHandler } from "./ServerlessTemplate";
import { IExtensionHandler } from "./Extension";
import { INamespaceHandler } from "./Namespace";

export interface IContext {
  get dir(): string;
  get moduleHandler(): IModuleHandler;
  get namespaceHandler(): INamespaceHandler;
  get serverlessTemplateHandler(): IServerlessTemplateHandler;
  get isUI(): boolean;
  get isServerless(): boolean;
  get extensionHandler(): IExtensionHandler;

  getModuleHash(moduleName: string): string;
}
