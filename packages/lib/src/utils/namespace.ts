import {
  IContext,
  IModuleHandler,
  INamespaceHandler,
  ModuleNamespace,
  ModuleNode,
  NamespaceLoader
} from "somod-types";
import { loadPublicAssetNamespaces } from "./nextJs/publicAssets";
import { loadPageNamespaces } from "./nextJs/pages";
import { loadConfigNamespaces } from "./nextJs/config";
import {
  loadApiRouteNamespaces,
  loadOutputNamespaces
} from "./serverless/namespace";
import { loadParameterNamespaces } from "./parameters/namespace";

export class NamespaceHandler implements INamespaceHandler {
  private static instance: INamespaceHandler;

  private _namespaces: Record<string, ModuleNamespace[]>;

  private constructor() {
    // do nothing
  }

  static async getInstance(context: IContext) {
    if (this.instance === undefined) {
      const moduleNamespaces = await this._loadNamespaces(context);
      const namespaceNameToValueToModulesMap =
        this._getNamespaceToModulesMap(moduleNamespaces);
      const moduleToAllChildrenMap = this._getModuleNameToAllChildrenMap(
        context.moduleHandler
      );
      this._resolveNamespaces(
        namespaceNameToValueToModulesMap,
        moduleToAllChildrenMap
      );

      const namespaces: Record<string, ModuleNamespace[]> = {};
      moduleNamespaces.forEach(moduleNamespace => {
        const name = moduleNamespace.name;
        if (namespaces[name] === undefined) {
          namespaces[name] = [];
        }
        namespaces[name].push(moduleNamespace);
      });

      const namespaceHandler = new NamespaceHandler();
      namespaceHandler._namespaces = namespaces;
      this.instance = namespaceHandler;
    }
    return this.instance;
  }

  private static async _loadNamespaces(context: IContext) {
    const namespaceLoaders: NamespaceLoader[] = [
      loadPageNamespaces,
      loadPublicAssetNamespaces,
      loadConfigNamespaces,
      loadApiRouteNamespaces,
      loadParameterNamespaces,
      loadOutputNamespaces
    ];
    namespaceLoaders.push(
      ...context.extensionHandler.namespaceLoaders.map(n => n.value)
    );
    const moduleNamespaceValues: ModuleNamespace[] = [];
    await Promise.all(
      context.moduleHandler.list.map(async moduleNode => {
        const module = moduleNode.module;
        await Promise.all(
          namespaceLoaders.map(async namespaceLoader => {
            const namespaces = await namespaceLoader(module, context);
            namespaces.forEach(namespace => {
              namespace.values.forEach(value => {
                moduleNamespaceValues.push({
                  name: namespace.name,
                  module: module.name,
                  value
                });
              });
            });
          })
        );
      })
    );

    return moduleNamespaceValues;
  }

  private static _getNamespaceToModulesMap(
    moduleNamespaceValues: ModuleNamespace[]
  ) {
    const namespaceToValueToModulesMap: Record<
      string,
      Record<string, string[]>
    > = {};

    moduleNamespaceValues.forEach(({ name, value, module }) => {
      if (namespaceToValueToModulesMap[name] === undefined) {
        namespaceToValueToModulesMap[name] = {};
      }
      if (namespaceToValueToModulesMap[name][value] === undefined) {
        namespaceToValueToModulesMap[name][value] = [];
      }
      namespaceToValueToModulesMap[name][value].push(module);
    });

    return namespaceToValueToModulesMap;
  }

  private static _getModuleNameToAllChildrenMap(moduleHandler: IModuleHandler) {
    const moduleNameToAllChildrenMap: Record<string, string[]> = {};
    moduleHandler.list.forEach(moduleNode => {
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

  private static _resolveNamespaces(
    namespaceToValueToModulesMap: Record<string, Record<string, string[]>>,
    moduleNameToAllChildrenMap: Record<string, string[]>
  ): Record<string, Record<string, string>> {
    const unresolvedNamespaces: Record<string, string[]> = {};

    Object.keys(namespaceToValueToModulesMap).forEach(name => {
      Object.keys(namespaceToValueToModulesMap[name]).forEach(value => {
        const namespaceModules = namespaceToValueToModulesMap[name][value];
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

          namespaceToValueToModulesMap[name][value] = Object.keys(
            hasParent
          ).filter(m => !hasParent[m]);

          if (namespaceToValueToModulesMap[name][value].length > 1) {
            if (!unresolvedNamespaces[name]) {
              unresolvedNamespaces[name] = [];
            }
            unresolvedNamespaces[name].push(value);
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
                    ` - ${namespace}\n${namespaceToValueToModulesMap[
                      namespaceName
                    ][namespace]
                      .map(moduleName => `   - ${moduleName}`)
                      .join("\n")}`
                )
                .join("\n")}`
          )
          .join("\n")}`
      );
    }

    const namespaceToModuleMap: Record<string, Record<string, string>> = {};
    Object.keys(namespaceToValueToModulesMap).forEach(namespaceName => {
      namespaceToModuleMap[namespaceName] = {};
      Object.keys(namespaceToValueToModulesMap[namespaceName]).forEach(
        namespace => {
          namespaceToModuleMap[namespaceName][namespace] =
            namespaceToValueToModulesMap[namespaceName][namespace][0];
        }
      );
    });

    return namespaceToModuleMap;
  }

  get names(): string[] {
    return Object.keys(this._namespaces);
  }
  get(name: string): ModuleNamespace[] {
    return this._namespaces[name];
  }
}
