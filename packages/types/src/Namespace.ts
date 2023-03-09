import { IContext } from "./Context";
import { Module } from "./Module";

export type Namespace = {
  name: string;
  values: string[];
};

export type ModuleNamespace = {
  name: string;
  module: string;
  value: string;
};

export type NamespaceLoader = (
  module: Module,
  context: IContext // context at this time will have only moduleHandler and extensionHandler initialized
) => Promise<Namespace[]>;

export interface INamespaceHandler {
  get names(): string[];
  get(name: string): ModuleNamespace[];
}
