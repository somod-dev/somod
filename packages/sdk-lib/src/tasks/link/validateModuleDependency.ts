import { getModuleInfo } from "../../utils/moduleInfo";

export const validateModuleDependency = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  await getModuleInfo(dir, moduleIndicators);
};
