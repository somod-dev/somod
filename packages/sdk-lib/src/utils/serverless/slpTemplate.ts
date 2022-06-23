import {
  ErrorSet,
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "@solib/cli-base";
import { mkdir } from "fs/promises";
import { cloneDeep } from "lodash";
import { dirname, join } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../constants";
import { Module, ModuleNode } from "../moduleHandler";
import { readYamlFileStore } from "../yamlFileStore";
import { baseModuleName, getBaseModuleOriginalSLPTemplate } from "./baseModule";
import { validate as validateDependsOn } from "./keywords/dependsOn";
import { validate as validateExtend } from "./keywords/extend";
import {
  validate as validateFunction,
  validateCustomResourceSchema
} from "./keywords/function";
import { validate as validateFunctionLayers } from "./keywords/functionLayerLibraries";
import { validate as validateRef } from "./keywords/ref";
import { validate as validateRefParameter } from "./keywords/refParameter";
import { validate as validateRefResourceName } from "./keywords/refResourceName";
import { OriginalSLPTemplate, ServerlessTemplate, SLPTemplate } from "./types";
import { updateKeywordPathsInSLPTemplate } from "./utils";

export class NoSLPTemplateError extends Error {
  constructor(file: string) {
    super("SLP template not found : " + file);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const loadBuiltSLPTemplate = async (
  module: Module
): Promise<OriginalSLPTemplate> => {
  const templateLocation = join(
    module.packageLocation,
    path_build,
    path_serverless,
    file_templateJson
  );
  try {
    const slpTemplate = (await readJsonFileStore(
      templateLocation
    )) as OriginalSLPTemplate;

    return slpTemplate;
  } catch (e) {
    const newError =
      e.message ==
      `ENOENT: no such file or directory, open '${templateLocation}'`
        ? new NoSLPTemplateError(templateLocation)
        : e;
    throw newError;
  }
};

const loadSourceSLPTemplate = async (
  module: Module
): Promise<OriginalSLPTemplate> => {
  const templateLocation = join(
    module.packageLocation,
    path_serverless,
    file_templateYaml
  );
  try {
    const slpTemplate = (await readYamlFileStore(
      templateLocation
    )) as OriginalSLPTemplate;

    return slpTemplate;
  } catch (e) {
    const newError =
      e.message ==
      `ENOENT: no such file or directory, open '${templateLocation}'`
        ? new NoSLPTemplateError(templateLocation)
        : e;
    throw newError;
  }
};

export const loadOriginalSlpTemplate = async (
  module: Module
): Promise<OriginalSLPTemplate> => {
  // the schema for slpTemplate is @somod/serverless-schema/schemas/index.json
  const originalSlpTemplate = module.root
    ? await loadSourceSLPTemplate(module)
    : await loadBuiltSLPTemplate(module);

  return originalSlpTemplate;
};

const loadSLPTemplate = async (
  moduleNode: ModuleNode
): Promise<SLPTemplate> => {
  const originalSlpTemplate = await loadOriginalSlpTemplate(moduleNode.module);

  const slpTemplate: SLPTemplate = {
    ...originalSlpTemplate,
    root: moduleNode.module.root,
    module: moduleNode.module.name,
    packageLocation: moduleNode.module.packageLocation,
    keywordPaths: null,
    original: cloneDeep(originalSlpTemplate)
  };

  updateKeywordPathsInSLPTemplate(slpTemplate);
  return slpTemplate;
};

const loadBaseSlpTemplate = async (): Promise<SLPTemplate> => {
  const originalSlpTemplate: OriginalSLPTemplate =
    await getBaseModuleOriginalSLPTemplate();

  const baseSlpTemplate = {
    ...originalSlpTemplate,
    root: false,
    module: baseModuleName,
    packageLocation: "",
    keywordPaths: null,
    original: cloneDeep(originalSlpTemplate)
  };
  updateKeywordPathsInSLPTemplate(baseSlpTemplate);
  return baseSlpTemplate;
};

/**
 * Tries to load the SLP Templates for the provided modules
 *
 * @returns SLPTemplate[], contains SLP Templates of only found templates, keeps the sort order same as the provided templates
 */
export const loadServerlessTemplate = async (
  modules: ModuleNode[]
): Promise<ServerlessTemplate> => {
  const slpTemplates = await Promise.all(
    modules.map(async module => {
      try {
        return await loadSLPTemplate(module);
      } catch (e) {
        if (e instanceof NoSLPTemplateError) {
          return false;
        } else {
          throw e;
        }
      }
    })
  );

  const baseSlpTemplate = await loadBaseSlpTemplate();

  const serverlessTemplate: Record<string, SLPTemplate> = {
    [baseSlpTemplate.module]: baseSlpTemplate
  };

  slpTemplates.forEach(slpTemplate => {
    if (slpTemplate) {
      serverlessTemplate[slpTemplate.module] = slpTemplate;
    }
  });

  return serverlessTemplate;
};

export const buildRootSLPTemplate = async (
  rootModuleNode: ModuleNode
): Promise<void> => {
  const originalSLPTemplate = await loadSourceSLPTemplate(
    rootModuleNode.module
  );

  const templateJsonPath = join(
    rootModuleNode.module.packageLocation,
    path_build,
    path_serverless,
    file_templateJson
  );

  const templateJsonDir = dirname(templateJsonPath);
  await mkdir(templateJsonDir, { recursive: true });
  updateJsonFileStore(templateJsonPath, originalSLPTemplate);
  await saveJsonFileStore(templateJsonPath);
};

export const validate = async (
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
  errors.push(...(await validateFunctionLayers(slpTemplate)));
  errors.push(...validateCustomResourceSchema(slpTemplate, serverlessTemplate));

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
