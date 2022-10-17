import { ModuleHandler, NamespaceLoader } from "./ModuleHandler";
import { KeywordDefinition } from "./ModuleJsonTemplate";
import {
  GetNodeRuntimeVersionType,
  GetParameterNameFromSAMOutputNameType,
  GetSAMOutputNameType,
  GetSAMResourceLogicalIdType,
  GetSAMResourceNameType
} from "./ServerlessUtils";

export type Mode = { ui: boolean; serverless: boolean };

export type Utils = {
  getNodeRuntimeVersion: GetNodeRuntimeVersionType;
  getSAMResourceLogicalId: GetSAMResourceLogicalIdType;
  getSAMResourceName: GetSAMResourceNameType;
  getSAMOutputName: GetSAMOutputNameType;
  getParameterNameFromSAMOutputName: GetParameterNameFromSAMOutputNameType;
};

export type LifeCycle = {
  namespaceLoader?: NamespaceLoader;
  keywords?: {
    uiConfig?: KeywordDefinition[];
    serverless?: KeywordDefinition[];
  };
  prebuild?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    utils: Utils
  ) => Promise<void>;
  build?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    utils: Utils
  ) => Promise<void>;
  preprepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    utils: Utils
  ) => Promise<void>;
  prepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    utils: Utils
  ) => Promise<void>;
};
