import { update as updateTsConfig } from "../../utils/tsConfigBuildJson";

export const update = async (
  dir: string,
  compilerOptions: Record<string, unknown> = {},
  include: string[] = []
): Promise<void> => {
  await updateTsConfig(dir, compilerOptions, include);
};
