import { readJsonFileStore } from "@solib/cli-base";
import { createHash } from "crypto";
import { existsSync } from "fs";
import { intersection, uniq } from "lodash";
import { dirname, join, normalize } from "path";
import { file_packageJson, path_nodeModules } from "./constants";
import { Node, bfs } from "@solib/graph";

export type Module = {
  type: string;
  name: string;
  version: string;
  packageLocation: string;
  namespaces: Record<string, string[]>;
};

export type NamespaceLoader = (module: Module) => Promise<void>;

export type ModuleNode = {
  module: Module;
  parents: ModuleNode[];
  children: ModuleNode[];
};

export class ModuleHandler {
  private rootDir: string;
  private moduleTypes: string[];

  private moduleLoadJobs: Record<string, Promise<ModuleNode>> = {};

  private locationToModuleNodeMap: Record<string, ModuleNode> = {};

  private moduleNameToLocationMap: Record<string, string> = {};

  private rootModuleNode: ModuleNode;

  private moduleNodesInBFSOrder: ModuleNode[];

  private constructor(rootDir: string, moduleTypes: string[]) {
    this.rootDir = rootDir;
    this.moduleTypes = moduleTypes;
  }

  /* MODULE LOAD FACTORY - START */

  private static moduleHandlerMap: Record<string, ModuleHandler> = {};

  static getModuleHandler(rootDir: string, moduleTypes: string[]) {
    const key = JSON.stringify({
      rootDir: normalize(rootDir),
      moduleTypes: [...moduleTypes].sort()
    });

    const keyHash = createHash("sha256").update(key).digest("hex");

    if (!ModuleHandler.moduleHandlerMap[keyHash]) {
      ModuleHandler.moduleHandlerMap[keyHash] = new ModuleHandler(
        rootDir,
        moduleTypes
      );
    }

    return ModuleHandler.moduleHandlerMap[keyHash];
  }

  /* MODULE LOAD FACTORY - END */

  /**
   * finds the location of the package from current location,
   * uses node's module loader algo https://nodejs.org/api/modules.html#loading-from-node_modules-folders
   */
  private findPackageLocation(from: string, packageName: string) {
    const fromPath = normalize(from);

    let packageLocation = fromPath;
    while (
      !existsSync(
        join(packageLocation, path_nodeModules, packageName, file_packageJson)
      )
    ) {
      const parentDir = dirname(packageLocation);
      if (parentDir == packageLocation) {
        throw new Error(`Package ${packageName} not found from ${from}`);
      }
      packageLocation = parentDir;
    }
    return join(packageLocation, path_nodeModules, packageName);
  }

  /**
   * creates ModuleNode from given packageLocation
   */
  private async loadModuleNode(packageLocation: string) {
    if (this.moduleLoadJobs[packageLocation] === undefined) {
      this.moduleLoadJobs[packageLocation] = (async () => {
        const packageJson = await readJsonFileStore(
          join(packageLocation, file_packageJson)
        );

        const matchedModuleTypes = this.moduleTypes.filter(
          moduleType => packageJson[moduleType] !== undefined
        );

        if (matchedModuleTypes.length == 0) {
          throw new Error("Not a module");
        } else {
          const module: Module = {
            type: matchedModuleTypes[0],
            name: packageJson.name as string,
            version: packageJson.version as string,
            packageLocation,
            namespaces: {}
          };

          const moduleNode: ModuleNode = {
            module,
            parents: [],
            children: []
          };
          this.locationToModuleNodeMap[packageLocation] = moduleNode;
          this.moduleNameToLocationMap[module.name] = packageLocation;

          const allDependencies = uniq([
            ...Object.keys(packageJson.dependencies || {}),
            ...intersection(
              Object.keys(packageJson.devDependencies || {}),
              Object.keys(packageJson.peerDependencies || {})
            )
          ]);

          const childModuleNodes = await Promise.all(
            allDependencies.map(async dependencyPackageName => {
              const dependencyPackageLocation = this.findPackageLocation(
                packageLocation,
                dependencyPackageName
              );
              try {
                const dependencyModuleNode = await this.loadModuleNode(
                  dependencyPackageLocation
                );
                dependencyModuleNode.parents.push(moduleNode);
                return dependencyModuleNode;
              } catch (e) {
                if (e.message == "Not a module") {
                  return null;
                } else {
                  throw e;
                }
              }
            })
          );

          moduleNode.children = childModuleNodes.filter(mn => !!mn);

          return moduleNode;
        }
      })();
    }
    return await this.moduleLoadJobs[packageLocation];
  }

  /*
   * Checks if a module has repeated with multiple versions
   * If there are multiple versions of a same module , an error is thrown
   */
  private checkDuplicates() {
    const allModulePackageLocations = Object.keys(this.locationToModuleNodeMap);

    const moduleNameToPackageLocationMap: Record<string, string[]> = {};

    allModulePackageLocations.forEach(location => {
      const moduleName = this.locationToModuleNodeMap[location].module.name;
      if (!moduleNameToPackageLocationMap[moduleName]) {
        moduleNameToPackageLocationMap[moduleName] = [];
      }
      moduleNameToPackageLocationMap[moduleName].push(location);
    });

    const repeatedModuleNames = Object.keys(
      moduleNameToPackageLocationMap
    ).filter(
      moduleName => moduleNameToPackageLocationMap[moduleName].length > 1
    );

    if (repeatedModuleNames.length > 0) {
      throw new Error(
        "Following modules are repeated\n" +
          repeatedModuleNames.map(
            repeatedModuleName =>
              `${repeatedModuleName}\n${moduleNameToPackageLocationMap[
                repeatedModuleName
              ]
                .map(l => " - " + l)
                .join("\n")}`
          )
      );
    }
  }

  private sort() {
    const moduleNameToModuleNodeMap: Record<string, ModuleNode> = {};
    const nodes: Node[] = [];

    Object.values(this.locationToModuleNodeMap).forEach(moduleNode => {
      moduleNameToModuleNodeMap[moduleNode.module.name] = moduleNode;
      nodes.push({
        name: moduleNode.module.name,
        children: moduleNode.children.map(c => c.module.name)
      });
    });

    const sortedNodes = bfs(nodes);
    this.moduleNodesInBFSOrder = sortedNodes.map(
      n => moduleNameToModuleNodeMap[n.name]
    );
  }

  private async load() {
    if (this.rootModuleNode == undefined) {
      this.rootModuleNode = await this.loadModuleNode(normalize(this.rootDir));
      this.checkDuplicates();
      this.sort();
    }
  }

  async getRoodModuleNode() {
    await this.load();
    return this.rootModuleNode;
  }

  async getModule(moduleName: string) {
    await this.load();
    return this.locationToModuleNodeMap[
      this.moduleNameToLocationMap[moduleName]
    ];
  }

  /**
   *
   * @returns the list of modules , all parents are listed before children
   */
  async listModules() {
    await this.load();
    return this.moduleNodesInBFSOrder;
  }

  private async loadNamespaces(loaders: Record<string, NamespaceLoader>) {
    await Promise.all(
      this.moduleNodesInBFSOrder.map(async moduleNode => {
        const loader = loaders[moduleNode.module.type];
        if (!loader) {
          throw new Error(
            `NamespaceLoader not found for ${moduleNode.module.type} module type`
          );
        }
        await loader(moduleNode.module);
      })
    );
  }

  private _getNamespaceToModulesMap() {
    const namespaceToModulesMap: Record<string, Record<string, string[]>> = {};

    this.moduleNodesInBFSOrder.forEach(moduleNode => {
      Object.keys(moduleNode.module.namespaces).forEach(namespaceName => {
        if (!namespaceToModulesMap[namespaceName]) {
          namespaceToModulesMap[namespaceName] = {};
        }
        moduleNode.module.namespaces[namespaceName].forEach(namespace => {
          if (!namespaceToModulesMap[namespaceName][namespace]) {
            namespaceToModulesMap[namespaceName][namespace] = [];
          }
          namespaceToModulesMap[namespaceName][namespace].push(
            moduleNode.module.name
          );
        });
      });
    });

    return namespaceToModulesMap;
  }

  private _getModuleNameToAllChildrenMap() {
    const moduleNameToAllChildrenMap: Record<string, string[]> = {};
    this.moduleNodesInBFSOrder.forEach(moduleNode => {
      const queue: ModuleNode[] = [moduleNode];
      const allChildren: string[] = [];
      while (queue.length > 0) {
        const node = queue.shift();
        node.children.forEach(childModuleNode => {
          if (!allChildren.includes(childModuleNode.module.name)) {
            allChildren.push(childModuleNode.module.name);
            queue.push(childModuleNode);
          }
        });
      }
      moduleNameToAllChildrenMap[moduleNode.module.name] = allChildren;
    });

    return moduleNameToAllChildrenMap;
  }

  private resolveNamespaces(): Record<string, Record<string, string>> {
    const namespaceToModulesMap = this._getNamespaceToModulesMap();
    const moduleNameToAllChildrenMap = this._getModuleNameToAllChildrenMap();

    const unresolvedNamespaces: Record<string, string[]> = {};

    Object.keys(namespaceToModulesMap).forEach(namespaceName => {
      Object.keys(namespaceToModulesMap[namespaceName]).forEach(namespace => {
        const namespaceModules =
          namespaceToModulesMap[namespaceName][namespace];
        if (namespaceModules.length > 1) {
          const hasParent: Record<string, boolean> = Object.fromEntries(
            namespaceModules.map(moduleName => [moduleName, false])
          );

          namespaceModules.forEach(moduleName => {
            moduleNameToAllChildrenMap[moduleName].forEach(childModuleName => {
              if (hasParent[childModuleName] === false) {
                hasParent[childModuleName] = true;
              }
            });
          });

          namespaceToModulesMap[namespaceName][namespace] = Object.keys(
            hasParent
          ).filter(m => !hasParent[m]);

          if (namespaceToModulesMap[namespaceName][namespace].length > 1) {
            if (!unresolvedNamespaces[namespaceName]) {
              unresolvedNamespaces[namespaceName] = [];
            }
            unresolvedNamespaces[namespaceName].push(namespace);
          }
        }
      });
    });

    const unresolvedNamespaceNames = Object.keys(unresolvedNamespaces);
    if (unresolvedNamespaceNames.length > 0) {
      throw new Error(
        `Following namespaces are unresolved\n${unresolvedNamespaceNames
          .map(
            namespaceName =>
              `${namespaceName}\n${unresolvedNamespaces[namespaceName]
                .map(
                  namespace =>
                    ` - ${namespace}\n${namespaceToModulesMap[namespaceName][
                      namespace
                    ]
                      .map(moduleName => `   - ${moduleName}`)
                      .join("\n")}`
                )
                .join("\n")}`
          )
          .join("\n")}`
      );
    }

    const namespaceToModuleMap: Record<string, Record<string, string>> = {};
    Object.keys(namespaceToModulesMap).forEach(namespaceName => {
      namespaceToModuleMap[namespaceName] = {};
      Object.keys(namespaceToModulesMap[namespaceName]).forEach(namespace => {
        namespaceToModuleMap[namespaceName][namespace] =
          namespaceToModulesMap[namespaceName][namespace][0];
      });
    });

    return namespaceToModuleMap;
  }

  async getNamespaces(loaders: Record<string, NamespaceLoader>) {
    await this.load();
    await this.loadNamespaces(loaders);
    return this.resolveNamespaces();
  }
}
