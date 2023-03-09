import { IContext } from "somod-types";
import { loadAllParameterValues } from "../../utils/parameters/load";
import { validateParameterValues as validate } from "../../utils/parameters/validate";

export const validateParameterValues = async (context: IContext) => {
  const parameterValues = await loadAllParameterValues(context);
  await validate(context, parameterValues);
};
