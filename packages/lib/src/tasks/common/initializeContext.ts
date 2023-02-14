import { Context } from "../../utils/context";

export const initializeContext = async (
  dir: string,
  isUI: boolean,
  isServerless: boolean,
  isDebugMode: boolean
) => {
  const context = await Context.getInstance(
    dir,
    isUI,
    isServerless,
    isDebugMode
  );
  return context;
};
