import { createHash } from "crypto";
import { normalize } from "path";
import ErrorSet from "./ErrorSet";
import {
  getAllDependencies,
  getDuplicateModules,
  getModuleGraph,
  toList
} from "./module";

export type ModuleInfo = {
  name: string;
  version: string;
  dependencies: string[];
  packageLocation: string;
};

const _getModuleInfo = async (
  dir: string,
  moduleIndicators: string[]
): Promise<ModuleInfo[]> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const allModuleNodes = toList(rootModuleNode);
  const repeatedModules = getDuplicateModules(allModuleNodes);
  if (repeatedModules.length > 0) {
    const errors: Error[] = repeatedModules.map(repeatedModule => {
      return new Error(
        `module ${
          repeatedModule.name
        } has more than one version at ${repeatedModule.modules
          .map((_module, i) => {
            return (
              i +
              1 +
              ". " +
              [..._module.path, repeatedModule.name].join(" -> ") +
              " (" +
              _module.version +
              ")"
            );
          })
          .join(", ")}`
      );
    });
    throw new ErrorSet(errors);
  }

  const parsedPackageLocations: string[] = [];

  const moduleInfo: ModuleInfo[] = [];
  allModuleNodes.forEach(moduleNode => {
    const { name, version, packageLocation } = moduleNode;

    if (!parsedPackageLocations.includes(packageLocation)) {
      moduleInfo.push({
        name,
        version,
        dependencies: getAllDependencies(moduleNode),
        packageLocation
      });
      parsedPackageLocations.push(packageLocation);
    }
  });

  return moduleInfo;
};

const moduleInfoPromises: Record<string, Promise<ModuleInfo[]>> = {};

export const getModuleInfo = (
  dir: string,
  moduleIndicators: string[]
): Promise<ModuleInfo[]> => {
  const _dir = normalize(dir);
  const _moduleIndicators = [...moduleIndicators];
  _moduleIndicators.sort();

  const hash = createHash("sha256")
    .update(_dir + "::" + _moduleIndicators)
    .digest("hex");

  if (!moduleInfoPromises[hash]) {
    moduleInfoPromises[hash] = _getModuleInfo(dir, moduleIndicators);
  }
  return moduleInfoPromises[hash];
};
