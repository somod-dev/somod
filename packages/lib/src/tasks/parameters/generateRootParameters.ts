import { IContext } from "somod-types";
import { generate } from "../../utils/parameters/generate";

export const generateRootParameters = async (
  context: IContext,
  override = false
): Promise<void> => {
  await generate(context, override);
};
