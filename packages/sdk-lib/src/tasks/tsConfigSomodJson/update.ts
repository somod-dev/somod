import { update as updateTsConfig } from "../../utils/tsConfigSomodJson";

export const update = async (
  dir: string,
  compilerOptions: Record<string, unknown> = {},
  include: string[] = []
): Promise<void> => {
  await updateTsConfig(dir, compilerOptions, include);
};
