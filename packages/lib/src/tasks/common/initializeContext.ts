import { Context } from "../../utils/context";

export const initializeContext = async (
  dir: string,
  isUI: boolean,
  isServerless: boolean
) => {
  const context = Context.getInstance(dir, isUI, isServerless);
  return context;
};
