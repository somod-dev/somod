import { Module, NamespaceLoader } from "@somod/types";
import {
  namespace_parameter,
  namespace_parameterGroup,
  namespace_parameterSchema
} from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { loadParameters } from "./load";

export const loadParameterNamespaces: NamespaceLoader = async (
  module: Module
) => {
  const parameters = await loadParameters(module);
  return {
    [namespace_parameter]: Object.keys(parameters?.Parameters || {}),
    [namespace_parameterSchema]: Object.keys(parameters?.Schemas || {}),
    [namespace_parameterGroup]: Object.keys(parameters?.Groups || {})
  };
};

export const listAllParameters = async (): Promise<Record<string, string>> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const parameters = (await moduleHandler.getNamespaces())[namespace_parameter];
  return parameters;
};

export const listAllParameterSchemas = async (): Promise<
  Record<string, string>
> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const parameterSchemas = (await moduleHandler.getNamespaces())[
    namespace_parameterSchema
  ];
  return parameterSchemas;
};

export const listAllParameterGroups = async (): Promise<string[]> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const parameterGroups = (await moduleHandler.getNamespaces())[
    namespace_parameterGroup
  ];
  return Object.keys(parameterGroups);
};
