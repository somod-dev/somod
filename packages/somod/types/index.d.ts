// TODO: This file is manually copied from ../sdk-lib/dist/utils/moduleHandler, makesure to keep this in sync with source

export declare type Module = {
  type: string;
  name: string;
  version: string;
  packageLocation: string;
  namespaces: Record<string, string[]>;
  root?: boolean;
};
export declare type NamespaceLoader = (module: Module) => Promise<void>;
export declare type ModuleNode = {
  module: Module;
  parents: ModuleNode[];
  children: ModuleNode[];
};
export declare class ModuleHandler {
  private rootDir;
  private moduleLoadJobs;
  private locationToModuleNodeMap;
  private moduleNameToLocationMap;
  private rootModuleNode;
  private moduleNodesInBFSOrder;
  private constructor();
  private static moduleHandlerMap;
  static getModuleHandler(rootDir: string): ModuleHandler;
  /**
   * finds the location of the package from current location,
   * uses node's module loader algo https://nodejs.org/api/modules.html#loading-from-node_modules-folders
   */
  private findPackageLocation;
  /**
   * creates ModuleNode from given packageLocation
   */
  private loadModuleNode;
  private checkDuplicates;
  private sort;
  private load;
  getRoodModuleNode(): Promise<ModuleNode>;
  getModule(moduleName: string): Promise<ModuleNode>;
  /**
   *
   * @returns the list of modules , all parents are listed before children
   */
  listModules(): Promise<ModuleNode[]>;
  private loadNamespaces;
  private _getNamespaceToModulesMap;
  private _getModuleNameToAllChildrenMap;
  private resolveNamespaces;
  /**
   * load and resolve the namespaces
   * @param loader NamespaceLoader , namespaceLoader must make sure that namespaces are not repeated in same module
   * @returns Map of NamespaceKey to (Map of namespace to moduleName)
   */
  getNamespaces(
    loader: NamespaceLoader
  ): Promise<Record<string, Record<string, string>>>;
}

// TODO: This file is manually copied from ../sdk-lib/dist/utils/plugin/types, makesure to keep this in sync with source
export declare type Mode = {
  ui: boolean;
  serverless: boolean;
};
export declare type Plugin = {
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
