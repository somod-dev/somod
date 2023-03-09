import { IContext, Module, NamespaceLoader } from "somod-types";
import { namespace_parameter } from "../constants";
import { loadParameters } from "./load";

export const loadParameterNamespaces: NamespaceLoader = async (
  module: Module
) => {
  const parameters = await loadParameters(module);
  return [
    {
      name: namespace_parameter,
      values: Object.keys(parameters?.parameters || {})
    }
  ];
};

export const getParameterToModuleMap = (context: IContext) => {
  const parameters = context.namespaceHandler.get(namespace_parameter);
  const parameterToModuleMap = Object.fromEntries(
    parameters.map(p => [p.value, p.module])
  );

  return parameterToModuleMap;
};
