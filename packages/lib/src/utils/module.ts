import { existsSync } from "fs";
import { bfs, Node } from "graph-dsa";
import { uniq } from "lodash";
import { dirname, join } from "path";
import { IModuleHandler, Module, ModuleNode } from "somod-types";
import { path_nodeModules } from "./constants";
import { freeze } from "./freeze";
import { read } from "./packageJson";

export class ModuleHandler implements IModuleHandler {
  private static instance: IModuleHandler;

  private _rootModuleName: string;
  private _moduleNodesMap: Record<string, ModuleNode>;
  private _moduleNamesInBFSOrder: string[];

  private constructor() {
    // do nothing
  }

  public static async getInstance(dir: string): Promise<IModuleHandler> {
    if (this.instance === undefined) {
      const moduleHandler = new ModuleHandler();

      const { rootModuleName, modules, moduleDependencies } =
        await this._loadModules(dir);

      if (rootModuleName === undefined) {
        throw new Error(`${dir} is not a SOMOD module`);
      }

      this._checkForRepeatedModules(modules);

      moduleHandler._rootModuleName = rootModuleName;
      moduleHandler._moduleNodesMap = this._generateModuleNodeMap(
        modules,
        moduleDependencies
      );
      moduleHandler._moduleNamesInBFSOrder = this._sortModules(
        moduleHandler._moduleNodesMap
      );
      freeze(moduleHandler._moduleNodesMap);
      freeze(moduleHandler._moduleNamesInBFSOrder);

      this.instance = moduleHandler;
    }
    return this.instance;
  }

  private static async _loadModules(dir: string) {
    const modules: Module[] = [];
    const moduleDependencies: { moduleName: string; dependencies: string[] }[] =
      [];
    let rootModuleName: string;

    const jobs: Record<string, Promise<void>> = {};
    const pendingJobsQueue: Promise<void>[] = [];

    const loadModule = async (packageDir: string, root = false) => {
      const packageJson = await read(packageDir);
      if (packageJson.somod !== undefined) {
        const module: Module = {
          name: packageJson.name as string,
          version: packageJson.version as string,
          packageLocation: packageDir,
          root
        };
        if (root) {
          rootModuleName = module.name;
        }
        modules.push(module);

        const allDependencies = uniq([
          ...Object.keys(packageJson.dependencies || {}),
          ...(root
            ? Object.keys(packageJson.devDependencies || {})
            : Object.keys(packageJson.peerDependencies || {}))
        ]);

        moduleDependencies.push({
          moduleName: module.name,
          dependencies: allDependencies
        });
        allDependencies.map(dependency => {
          const dependencyPackageLocation = this._findModulePackageLocation(
            dependency,
            packageDir
          );
          if (jobs[dependencyPackageLocation] === undefined) {
            jobs[dependencyPackageLocation] = loadModule(
              dependencyPackageLocation
            );
            pendingJobsQueue.push(jobs[dependencyPackageLocation]);
          }
        });
      }
    };

    jobs[dir] = loadModule(dir, true);
    pendingJobsQueue.push(jobs[dir]);

    while (pendingJobsQueue.length > 0) {
      const awaitingJobQueue = [];
      while (pendingJobsQueue.length > 0) {
        awaitingJobQueue.push(pendingJobsQueue.shift());
      }
      await Promise.all(awaitingJobQueue);
    }

    return { rootModuleName, modules, moduleDependencies };
  }

  private static _findModulePackageLocation(moduleName: string, from: string) {
    let moduleContainingDir = from;
    while (
      !existsSync(join(moduleContainingDir, path_nodeModules, moduleName))
    ) {
      const parentDir = dirname(moduleContainingDir);
      if (parentDir == moduleContainingDir) {
        throw new Error(`Module ${moduleName} not found from ${from}`);
      }
      moduleContainingDir = parentDir;
    }
    return join(moduleContainingDir, path_nodeModules, moduleName);
  }

  private static _checkForRepeatedModules(modules: Module[]) {
    const moduleLocations: Record<string, string[]> = {};
    modules.forEach(module => {
      if (moduleLocations[module.name] === undefined) {
        moduleLocations[module.name] = [];
      }
      moduleLocations[module.name].push(module.packageLocation);
    });

    const repeatedModuleNames = Object.keys(moduleLocations).filter(
      moduleName => moduleLocations[moduleName].length > 1
    );

    if (repeatedModuleNames.length > 0) {
      throw new Error(
        "Following modules are repeated\n" +
          repeatedModuleNames.map(
            repeatedModuleName =>
              `${repeatedModuleName}\n${moduleLocations[repeatedModuleName]
                .map(l => " - " + l)
                .join("\n")}`
          )
      );
    }
  }

  private static _generateModuleNodeMap(
    modules: Module[],
    moduleDependencies: { moduleName: string; dependencies: string[] }[]
  ) {
    const moduleNodesMap: Record<string, ModuleNode> = {};
    modules.forEach(module => {
      moduleNodesMap[module.name] = { module, children: [], parents: [] };
    });
    moduleDependencies.forEach(moduleDependency => {
      const moduleName = moduleDependency.moduleName;
      moduleDependency.dependencies.forEach(dependency => {
        if (moduleNodesMap[dependency]) {
          moduleNodesMap[moduleName].children.push(moduleNodesMap[dependency]);
          moduleNodesMap[dependency].parents.push(moduleNodesMap[moduleName]);
        }
      });
    });
    return moduleNodesMap;
  }

  private static _sortModules(moduleNodesMap: Record<string, ModuleNode>) {
    const nodes: Node[] = [];

    Object.values(moduleNodesMap).forEach(moduleNode => {
      nodes.push({
        name: moduleNode.module.name,
        children: moduleNode.children.map(c => c.module.name)
      });
    });

    const sortedNodes = bfs(nodes);
    const sortedModuleNames = sortedNodes.map(n => n.name);
    return sortedModuleNames;
  }

  get rootModuleName(): string {
    return this._rootModuleName;
  }

  getModule(moduleName: string): ModuleNode {
    const moduleNode = this._moduleNodesMap[moduleName];
    if (moduleNode === undefined) {
      throw new Error(`module '${moduleName}' not found`);
    }
    return moduleNode;
  }

  get list(): ModuleNode[] {
    return this._moduleNamesInBFSOrder.map(n => this._moduleNodesMap[n]);
  }
}
