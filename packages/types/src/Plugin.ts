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

export type Plugin = {
  tsconfig?: {
    compilerOptions?: Record<string, unknown>;
    include?: string[];
  };
  ignorePatterns?: {
    git?: string[];
    eslint?: string[];
    prettier?: string[];
  };
  namespaceLoader?: NamespaceLoader;
  keywords?: {
    uiConfig?: KeywordDefinition[];
    serverless?: KeywordDefinition[];
  };
  prebuild?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  build?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  preprepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode
  ) => Promise<void>;
  prepare?: (
    dir: string,
    moduleHandler: ModuleHandler,
    mode: Mode,
    serverlessUtils: {
      getNodeRuntimeVersion: GetNodeRuntimeVersionType;
      getSAMResourceLogicalId: GetSAMResourceLogicalIdType;
      getSAMResourceName: GetSAMResourceNameType;
      getSAMOutputName: GetSAMOutputNameType;
      getParameterNameFromSAMOutputName: GetParameterNameFromSAMOutputNameType;
    }
  ) => Promise<void>;
};
