import { generate } from "../../utils/parameters/generate";

export const generateRootParameters = async (
  dir: string,
  override = false
): Promise<void> => {
  await generate(dir, override);
};
