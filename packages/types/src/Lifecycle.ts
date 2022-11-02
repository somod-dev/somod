import { IModuleHandler, NamespaceLoader } from "./IModuleHandler";
import { KeywordDefinition } from "./ModuleJsonTemplate";
import { IServerlessTemplateHandler } from "./IServerlessTemplateHandler";

export type Mode = { ui: boolean; serverless: boolean };

export type LifeCycle = {
  namespaceLoader?: NamespaceLoader;
  keywords?: {
    uiConfig?: KeywordDefinition[];
    serverless?: KeywordDefinition[];
  };
  prebuild?: (
    dir: string,
    moduleHandler: IModuleHandler,
    serverlessTemplateHandler: IServerlessTemplateHandler,
    mode: Mode
  ) => Promise<void>;
  build?: (
    dir: string,
    moduleHandler: IModuleHandler,
    serverlessTemplateHandler: IServerlessTemplateHandler,
    mode: Mode
  ) => Promise<void>;
  preprepare?: (
    dir: string,
    moduleHandler: IModuleHandler,
    serverlessTemplateHandler: IServerlessTemplateHandler,
    mode: Mode
  ) => Promise<void>;
  prepare?: (
    dir: string,
    moduleHandler: IModuleHandler,
    serverlessTemplateHandler: IServerlessTemplateHandler,
    mode: Mode
  ) => Promise<void>;
};
