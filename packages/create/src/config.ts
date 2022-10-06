import { CompilerOptions } from "typescript";

export type Config = {
  somodName: string;
  somodVersion?: string;
  ignorePaths?: {
    git?: string[];
    prettier?: string[];
    eslint?: string[];
  };
  plugins?: (string | { name: string; version: string })[];
  files?: Record<string, string>;
  tsConfig?: {
    compilerOptions?: CompilerOptions;
    include?: string[];
    exclude?: string[];
  };
  dependencies?: {
    dep?: string[];
    dev?: string[];
    peer?: string[];
  };
  postInit?: (dir: string, verbose: boolean) => Promise<void>;
};

export type GetConfig = (
  mode: "ALL" | "UI" | "SERVERLESS"
) => Config | Promise<Config>;
