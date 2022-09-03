export type Module = Readonly<{
  name: string;
  version: string;
  packageLocation: string;
  namespaces: Readonly<Record<string, string[]>>;
  root?: boolean;
}>;

export type NamespaceLoader = (
  module: Module
) => Promise<Record<string, string[]>>;

export type ModuleNode = Readonly<{
  module: Module;
  parents: ModuleNode[];
  children: ModuleNode[];
}>;

export abstract class ModuleHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initialize(rootDir: string, namespaceLoaders: NamespaceLoader[]) {
    throw new Error("This method must be overrided in child class");
  }
  static getModuleHandler(): ModuleHandler {
    throw new Error("This method must be overrided in child class");
  }

  abstract getRoodModuleNode(): Promise<ModuleNode>;

  abstract getModule(moduleName: string): Promise<ModuleNode>;

  /**
   * @returns the list of modules , all parents are listed before children
   */
  abstract listModules(): Promise<ModuleNode[]>;

  /**
   * load and resolve the namespaces
   * @returns Map of NamespaceKey to (Map of namespace to moduleName)
   */
  abstract getNamespaces(): Promise<Record<string, Record<string, string>>>;
}
