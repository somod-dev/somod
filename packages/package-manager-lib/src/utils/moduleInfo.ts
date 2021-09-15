import { createHash } from "crypto";
import { normalize } from "path";
import {
  checkForRepeatedModules,
  getAllDependencies,
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
  checkForRepeatedModules(allModuleNodes);

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
