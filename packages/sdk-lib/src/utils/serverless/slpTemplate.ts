import {
  ErrorSet,
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "@sodaru/cli-base";
import { mkdir, readFile } from "fs/promises";
import { load } from "js-yaml";
import { join, dirname } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../constants";
import { ModuleNode } from "../module";
import { validate as validateDependsOn } from "./keywords/dependsOn";
import { apply, validate as validateExtend } from "./keywords/extend";
import { validate as validateFunction } from "./keywords/function";
import { validate as validateRef } from "./keywords/ref";
import { validate as validateRefParameter } from "./keywords/refParameter";
import { validate as validateRefResourceName } from "./keywords/refResourceName";
import {
  updateCurrentModuleInSLPTemplate,
  updateKeywordPathsInSLPTemplate
} from "./keywords/utils";
import { OriginalSLPTemplate, ServerlessTemplate, SLPTemplate } from "./types";

const loadDependentSLPTemplate = async (
  moduleNode: ModuleNode
): Promise<OriginalSLPTemplate> => {
  const slpTemplate = (await readJsonFileStore(
    join(
      moduleNode.packageLocation,
      path_build,
      path_serverless,
      file_templateJson
    )
  )) as OriginalSLPTemplate;

  return slpTemplate;
};

const loadRootSLPTemplate = async (
  moduleNode: ModuleNode
): Promise<OriginalSLPTemplate> => {
  const templateYamlPath = join(
    moduleNode.packageLocation,
    path_serverless,
    file_templateYaml
  );
  const templateYamlContent = await readFile(templateYamlPath, {
    encoding: "utf8"
  });
  const slpTemplate = load(templateYamlContent) as OriginalSLPTemplate;

  return slpTemplate;
};

export const loadSLPTemplate = async (
  moduleNode: ModuleNode,
  root = false
): Promise<SLPTemplate> => {
  // the schema for slpTemplate is @somod/serverless-schema/schemas/index.json
  const originalSlpTemplate = root
    ? await loadRootSLPTemplate(moduleNode)
    : await loadDependentSLPTemplate(moduleNode);

  const slpTemplate: SLPTemplate = {
    ...originalSlpTemplate,
    root,
    module: moduleNode.name,
    packageLocation: moduleNode.packageLocation,
    extendedResources: {},
    keywordPaths: null
  };

  slpTemplate.extendedResources = {};
  updateKeywordPathsInSLPTemplate(slpTemplate);
  updateCurrentModuleInSLPTemplate(moduleNode.name, slpTemplate);
  return slpTemplate;
};

export const mergeSLPTemplates = (
  slpTemplates: SLPTemplate[]
): ServerlessTemplate => {
  const serverlessTemplate: ServerlessTemplate = {};

  slpTemplates.forEach(slpTemplate => {
    apply(slpTemplate, serverlessTemplate);
    serverlessTemplate[slpTemplate.module] = slpTemplate;
  });

  return serverlessTemplate;
};

export const buildRootSLPTemplate = async (
  rootModuleNode: ModuleNode
): Promise<void> => {
  const originalSLPTemplate = await loadRootSLPTemplate(rootModuleNode);

  const templateJsonPath = join(
    rootModuleNode.packageLocation,
    path_build,
    path_serverless,
    file_templateJson
  );

  const templateJsonDir = dirname(templateJsonPath);
  await mkdir(templateJsonDir, { recursive: true });
  updateJsonFileStore(templateJsonPath, originalSLPTemplate);
  await saveJsonFileStore(templateJsonPath);
};

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
) => {
  const errors: Error[] = [];
  errors.push(...validateExtend(slpTemplate, serverlessTemplate));
  errors.push(...validateDependsOn(slpTemplate, serverlessTemplate));
  errors.push(...validateRef(slpTemplate, serverlessTemplate));
  errors.push(...validateRefParameter(slpTemplate, serverlessTemplate));
  errors.push(...validateRefResourceName(slpTemplate, serverlessTemplate));
  errors.push(...validateFunction(slpTemplate));

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
