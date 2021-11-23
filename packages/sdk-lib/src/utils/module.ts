import { existsSync } from "fs";
import { join, normalize, sep } from "path";
import { file_packageJson, path_nodeModules } from "./constants";
import { ErrorSet, readJsonFileStore, unixStylePath } from "@sodaru/cli-base";

export type ModuleNode = {
  name: string;
  version: string;
  packageLocation: string;
  dependencies: ModuleNode[];
};

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

export const getModuleGraph = async (
  dir: string,
  moduleIndicators: string[]
): Promise<ModuleNode> => {
  if (moduleIndicators.length == 0) {
    throw new Error("moduleIndicators must not be empty array");
  }

  const parsedPaths: Record<string, Promise<ModuleNode | false>> = {};

  const parsePathForModule = async (
    dir: string,
    rootDir: string
  ): Promise<ModuleNode | false> => {
    const packageJson = await readJsonFileStore(join(dir, file_packageJson));
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

type ModuleNodeWithPath = ModuleNode & {
  path: string[];
};

export const toList = (moduleNode: ModuleNode): ModuleNodeWithPath[] => {
  const dependencies: ModuleNodeWithPath[] = [];
  moduleNode.dependencies.forEach(dependency => {
    const childDependecies = toList(dependency);
    childDependecies.forEach(childDependecy => {
      childDependecy.path.unshift(moduleNode.name);
      dependencies.push(childDependecy);
    });
  });
  const thisNode: ModuleNodeWithPath = { ...moduleNode, path: [] };
  dependencies.unshift(thisNode);
  return dependencies;
};

type DuplicateModules = {
  name: string;
  modules: ModuleNodeWithPath[];
};

export const getDuplicateModules = (
  modules: ModuleNodeWithPath[]
): DuplicateModules[] => {
  const nameVersionModuleMap: Record<
    string,
    Record<string, ModuleNodeWithPath[]>
  > = {};

  modules.forEach(module => {
    const name = module.name;
    if (!nameVersionModuleMap[name]) {
      nameVersionModuleMap[name] = {};
    }
    const version = module.version;
    if (!nameVersionModuleMap[name][version]) {
      nameVersionModuleMap[name][version] = [];
    }
    nameVersionModuleMap[name][version].push(module);
  });

  const duplicateModules: DuplicateModules[] = [];
  Object.keys(nameVersionModuleMap).forEach(name => {
    const versionModuleMap = nameVersionModuleMap[name];
    const versions = Object.keys(versionModuleMap);
    if (versions.length > 1) {
      const modules = versions.reduce((_modules, version) => {
        return [..._modules, ...versionModuleMap[version]];
      }, []);
      duplicateModules.push({ name, modules });
    }
  });

  return duplicateModules;
};

export const checkForRepeatedModules = (
  modules: ModuleNodeWithPath[]
): void => {
  const repeatedModules = getDuplicateModules(modules);
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
};

export const getAllDependencies = (module: ModuleNode): string[] => {
  const queue: ModuleNode[] = [module];
  const dependencies: string[] = [];
  let node = queue.shift();
  while (node) {
    node.dependencies.forEach(dependencyNode => {
      const dependencyName = dependencyNode.name;
      if (!dependencies.includes(dependencyName)) {
        dependencies.push(dependencyName);
        queue.push(dependencyNode);
      }
    });
    node = queue.shift();
  }
  return dependencies;
};

export const resolve = (
  moduleNames: string[],
  dependencyMap: Record<string, string[]>
): string => {
  if (moduleNames.length == 1) {
    return moduleNames[0];
  }

  const overrided: Record<string, boolean> = Object.fromEntries(
    moduleNames.map(moduleName => [moduleName, false])
  );

  moduleNames.forEach(moduleName => {
    if (!overrided[moduleName]) {
      const dependencies = dependencyMap[moduleName];
      if (!dependencies) {
        throw new Error(`module ${moduleName} not found in dependency map`);
      }
      dependencies.forEach(dependency => {
        if (moduleNames.includes(dependency)) {
          overrided[dependency] = true;
        }
      });
    }
  });

  const notOverridedModules: string[] = [];
  Object.keys(overrided).forEach(moduleName => {
    if (!overrided[moduleName]) {
      notOverridedModules.push(moduleName);
    }
  });

  if (notOverridedModules.length > 1) {
    throw new Error("Can not resolve");
  }
  return notOverridedModules[0];
};