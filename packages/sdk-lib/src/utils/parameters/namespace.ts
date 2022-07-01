import { namespace_parameter } from "../constants";
import { Module, ModuleHandler } from "../moduleHandler";
import { loadParameters } from "./load";

export const loadParameterNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_parameter]) {
    const parameters = await loadParameters(module);
    module.namespaces[namespace_parameter] = Object.keys(
      parameters.Parameters || {}
    );
  }
};

export const listAllParameters = async (
  dir: string,
  moduleIndicators: string[]
): Promise<string[]> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const parameters = (
    await moduleHandler.getNamespaces(
      Object.fromEntries(
        moduleIndicators.map(mt => [mt, loadParameterNamespaces])
      )
    )
  )[namespace_parameter];
  return Object.keys(parameters);
};
