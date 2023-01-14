import { Module, NamespaceLoader } from "somod-types";
import { namespace_parameter } from "../constants";
import { ModuleHandler } from "../module";
import { loadParameters } from "./load";

export const loadParameterNamespaces: NamespaceLoader = async (
  module: Module
) => {
  const parameters = await loadParameters(module);
  return {
    [namespace_parameter]: Object.keys(parameters?.parameters || {})
  };
};

export const listAllParameters = async (): Promise<Record<string, string>> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const parameters = (await moduleHandler.getNamespaces())[namespace_parameter];
  return parameters;
};
