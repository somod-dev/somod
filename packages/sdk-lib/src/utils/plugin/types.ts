import { Module, ModuleHandler } from "../moduleHandler";

export type Mode = { ui: boolean; serverless: boolean };

export type Plugin = {
  init?: (dir: string, mode: Mode) => Promise<void>;
  tsconfig?: {
    compilerOptions?: Record<string, unknown>;
    include?: string[];
  };
  namespaceLoader?: (module: Module, mode: Mode) => Promise<void>;
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
    mode: Mode
  ) => Promise<void>;
};
