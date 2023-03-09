export type Module = Readonly<{
  name: string;
  version: string;
  packageLocation: string;
  root?: boolean;
}>;

export type ModuleNode = Readonly<{
  module: Module;
  parents: ModuleNode[];
  children: ModuleNode[];
}>;

export interface IModuleHandler {
  get roodModuleName(): string;

  getModule(moduleName: string): ModuleNode;

  /**
   * @returns the list of modules , all parents are listed before children
   */
  get list(): ModuleNode[];
}
