import { readJsonFileStore } from "@solib/cli-base";
import { existsSync } from "fs";
import { join } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../../constants";
import { freeze } from "../../freeze";
import { keywordAjvCompile } from "../../keywords/ajv-compile";
import { keywordAnd } from "../../keywords/and";
import { keywordEquals } from "../../keywords/equals";
import { keywordIf } from "../../keywords/if";
import { keywordJsonParse } from "../../keywords/json-parse";
import { keywordJsonStringify } from "../../keywords/json-stringify";
import { keywordKey } from "../../keywords/key";
import { keywordOr } from "../../keywords/or";
import { keywordParameter } from "../../keywords/parameter";
import { keywordAccess } from "../keywords/access";
import { keywordDependsOn } from "../keywords/dependsOn";
import { keywordExtend } from "../keywords/extend";
import { keywordFunction } from "../keywords/function";
import { keywordFunctionLayer } from "../keywords/functionLayer";
import { keywordModuleName } from "../keywords/moduleName";
import { keywordOutput } from "../keywords/output";
import { keywordRef } from "../keywords/ref";
import { keywordResourceName } from "../keywords/resourceName";
import { ModuleContent, ModuleContentMap } from "../../keywords/types";
import { Module } from "../../moduleHandler";
import { readYamlFileStore } from "../../yamlFileStore";
import {
  ModuleServerlessTemplate,
  ModuleServerlessTemplateMap,
  ServerlessTemplate
} from "../types";
import { keywordCreateIf } from "../keywords/createIf";
import { keywordTemplateOutputs } from "../keywords/templateOutputs";

const loadBuiltServerlessTemplate = async (
  module: Module
): Promise<ServerlessTemplate | undefined> => {
  const templateLocation = join(
    module.packageLocation,
    path_build,
    path_serverless,
    file_templateJson
  );

  if (existsSync(templateLocation)) {
    const template = (await readJsonFileStore(
      templateLocation
    )) as ServerlessTemplate;

    return freeze(template, true);
  }
};

const loadSourceServerlessTemplate = async (
  module: Module
): Promise<ServerlessTemplate | undefined> => {
  const templateLocation = join(
    module.packageLocation,
    path_serverless,
    file_templateYaml
  );

  if (existsSync(templateLocation)) {
    const template = (await readYamlFileStore(
      templateLocation
    )) as ServerlessTemplate;

    return freeze(template, true);
  }
};

const loadServerlessTemplate = async (
  module: Module
): Promise<ModuleServerlessTemplate | undefined> => {
  const template = module.root
    ? await loadSourceServerlessTemplate(module)
    : await loadBuiltServerlessTemplate(module);

  if (template) {
    return freeze({
      module: module.name,
      packageLocation: module.packageLocation,
      root: module.root,
      template
    });
  }
};

export const loadServerlessTemplateMap = async (
  modules: Module[]
): Promise<ModuleServerlessTemplateMap> => {
  const serverlessTemplateMap: Record<string, ModuleServerlessTemplate> = {};
  await Promise.all(
    modules.map(async module => {
      const serverlessTemplate = await loadServerlessTemplate(module);
      if (serverlessTemplate) {
        serverlessTemplateMap[module.name] = serverlessTemplate;
      }
    })
  );
  return freeze(serverlessTemplateMap);
};

export const getModuleContentMap = (
  moduleServerlessTemplateMap: ModuleServerlessTemplateMap
): ModuleContentMap<ServerlessTemplate> => {
  const moduleContentMap: Record<
    string,
    ModuleContent<ServerlessTemplate>
  > = {};

  Object.keys(moduleServerlessTemplateMap).forEach(moduleName => {
    const m = moduleServerlessTemplateMap[moduleName];
    moduleContentMap[moduleName] = freeze({
      moduleName,
      location: m.packageLocation,
      path: m.root
        ? `${path_serverless}/${file_templateYaml}`
        : `${path_build}/${path_serverless}/${file_templateJson}`,
      json: m.template
    });
  });

  return freeze(moduleContentMap);
};

export const getKeywords = () => {
  const keywords = [
    keywordAjvCompile,
    keywordAnd,
    keywordEquals,
    keywordIf,
    keywordJsonParse,
    keywordJsonStringify,
    keywordKey,
    keywordOr,
    keywordParameter,
    keywordAccess,
    keywordCreateIf,
    keywordDependsOn,
    keywordExtend,
    keywordFunction,
    keywordFunctionLayer,
    keywordModuleName,
    keywordOutput,
    keywordRef,
    keywordResourceName,
    keywordTemplateOutputs
  ];
  return keywords;
};
