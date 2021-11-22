import { validate } from "../../utils/tsConfigBuildJson";

export const isValid = async (
  dir: string,
  compilerOptions: Record<string, unknown> = {},
  include: string[] = []
): Promise<void> => {
  await validate(dir, compilerOptions, include);
};
