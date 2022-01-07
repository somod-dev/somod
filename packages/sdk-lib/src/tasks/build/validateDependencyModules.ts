import {
  checkForRepeatedModules,
  getModuleGraph,
  toList
} from "../../utils/module";

export const validateDependencyModules = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const allModuleNodes = toList(rootModuleNode);
  checkForRepeatedModules(allModuleNodes);
};
