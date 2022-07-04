import { generate } from "../../utils/parameters/generate";

export const generateRootParameters = async (
  dir: string,
  moduleIndicators: string[],
  override = false
): Promise<void> => {
  await generate(dir, moduleIndicators, override);
};
