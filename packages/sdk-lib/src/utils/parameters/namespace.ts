import {
  namespace_parameter,
  namespace_parameterGroup,
  namespace_parameterSchema
} from "../constants";
import { Module, ModuleHandler } from "../moduleHandler";
import { loadParameters } from "./load";

export const loadParameterNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_parameter]) {
    const parameters = await loadParameters(module);
    module.namespaces[namespace_parameter] = Object.keys(
      parameters.Parameters || {}
    );
    module.namespaces[namespace_parameterSchema] = Object.keys(
      parameters.Schemas || {}
    );
    module.namespaces[namespace_parameterGroup] = Object.keys(
      parameters.Groups || {}
    );
  }
};

export const listAllParameters = async (
  dir: string
): Promise<Record<string, string>> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  const parameters = (
    await moduleHandler.getNamespaces(loadParameterNamespaces)
  )[namespace_parameter];
  return parameters;
};

export const listAllParameterSchemas = async (
  dir: string
): Promise<Record<string, string>> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  const parameterSchemas = (
    await moduleHandler.getNamespaces(loadParameterNamespaces)
  )[namespace_parameterSchema];
  return parameterSchemas;
};

export const listAllParameterGroups = async (
  dir: string
): Promise<string[]> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  const parameterGroups = (
    await moduleHandler.getNamespaces(loadParameterNamespaces)
  )[namespace_parameterGroup];
  return Object.keys(parameterGroups);
};
