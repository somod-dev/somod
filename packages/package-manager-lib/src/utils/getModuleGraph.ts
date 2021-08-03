import { existsSync } from "fs";
import { join, normalize, sep } from "path";
import { file_packageJson, path_nodeModules } from "./constants";
import { read } from "./jsonFileStore";
import unixStylePath from "./unixStylePath";

const packageExists = (dir: string): boolean => {
  return existsSync(join(dir, file_packageJson));
};

const findPackageLocation = (
  rootDir: string,
  currentDir: string,
  name: string
): string => {
  const normalizedRootDir = normalize(rootDir);
  const normalizedCurrentDir = normalize(currentDir);

  let location: string = null;
  const packageInCurrentDirectory = join(currentDir, path_nodeModules, name);
  if (packageExists(packageInCurrentDirectory)) {
    location = packageInCurrentDirectory;
  } else {
    let pathToSearch = normalizedCurrentDir.substr(normalizedRootDir.length);
    while (pathToSearch.startsWith(sep)) {
      pathToSearch = pathToSearch.substr(1);
    }

    const pathFragments = pathToSearch.split(sep);

    const pathFragmentsCount = pathFragments.length;
    for (let i = pathFragmentsCount - 1; i >= 0; i--) {
      if (pathFragments[i] == path_nodeModules) {
        const packageLocation = join(
          rootDir,
          ...pathFragments.slice(0, i + 1),
          name
        );
        if (packageExists(packageLocation)) {
          location = packageLocation;
          break;
        }
      }
    }
  }

  if (!location) {
    throw new Error(
      `Could not found module ${name} from ${unixStylePath(currentDir)}`
    );
  } else {
    return location;
  }
};

export type ModuleNode = {
  name: string;
  version: string;
  packageLocation: string;
  dependencies: ModuleNode[];
};

const getModuleGraph = async (
  dir: string,
  moduleIndicators: string[]
): Promise<ModuleNode> => {
  const parsedPaths: Record<string, Promise<ModuleNode | false>> = {};

  const parsePathForModule = async (
    dir: string,
    rootDir: string
  ): Promise<ModuleNode | false> => {
    const packageJson = await read(join(dir, file_packageJson));
    if (!moduleIndicators.every(indicator => !packageJson[indicator])) {
      const moduleNode: ModuleNode = {
        name: packageJson.name as string,
        version: packageJson.version as string,
        packageLocation: unixStylePath(dir),
        dependencies: []
      };
      const dependencies = packageJson.dependencies;
      if (dependencies) {
        const dependencyModules = await Promise.all(
          Object.keys(dependencies).map(async moduleName => {
            const moduleLocation = findPackageLocation(
              rootDir,
              dir,
              moduleName
            );
            if (!parsedPaths[moduleLocation]) {
              parsedPaths[moduleLocation] = parsePathForModule(
                moduleLocation,
                rootDir
              );
            }
            return await parsedPaths[moduleLocation];
          })
        );
        moduleNode.dependencies = dependencyModules.filter(
          m => !!m
        ) as ModuleNode[];
      }
      return moduleNode;
    } else {
      return false;
    }
  };

  const modulePromise = parsePathForModule(dir, dir);
  parsedPaths[dir] = modulePromise;
  const module = await modulePromise;
  if (module === false) {
    throw new Error(
      `${unixStylePath(dir)} is not ${moduleIndicators.join(" or ")} module`
    );
  }
  return module;
};

export default getModuleGraph;
