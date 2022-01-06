import {
  ErrorSet,
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "@sodaru/cli-base";
import { mkdir, readFile } from "fs/promises";
import { load } from "js-yaml";
import { cloneDeep } from "lodash";
import { dirname, join } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../constants";
import { getToBeBundledLibraries } from "../library";
import { ModuleNode } from "../module";
import { validate as validateDependsOn } from "./keywords/dependsOn";
import { validate as validateExtend } from "./keywords/extend";
import {
  applyBaseLayer,
  validate as validateFunction
} from "./keywords/function";
import { validate as validateRef } from "./keywords/ref";
import { validate as validateRefParameter } from "./keywords/refParameter";
import { validate as validateRefResourceName } from "./keywords/refResourceName";
import {
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPOutput,
  KeywordSLPResourceName,
  OriginalSLPTemplate,
  ServerlessTemplate,
  SLPResource,
  SLPTemplate,
  SLPTemplateType
} from "./types";
import { updateKeywordPathsInSLPTemplate } from "./utils";

export class NoSLPTemplateError extends Error {
  constructor(file: string) {
    super("SLP template not found : " + file);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const loadBuiltSLPTemplate = async (
  moduleNode: ModuleNode
): Promise<OriginalSLPTemplate> => {
  const templateLocation = join(
    moduleNode.packageLocation,
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
  moduleNode: ModuleNode
): Promise<OriginalSLPTemplate> => {
  const templateLocation = join(
    moduleNode.packageLocation,
    path_serverless,
    file_templateYaml
  );
  try {
    const templateYamlContent = await readFile(templateLocation, {
      encoding: "utf8"
    });
    const slpTemplate = load(templateYamlContent) as OriginalSLPTemplate;

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

export const loadSLPTemplate = async (
  moduleNode: ModuleNode,
  type: SLPTemplateType = "dependent"
): Promise<SLPTemplate> => {
  // the schema for slpTemplate is @somod/serverless-schema/schemas/index.json
  const originalSlpTemplate =
    type == "source"
      ? await loadSourceSLPTemplate(moduleNode)
      : await loadBuiltSLPTemplate(moduleNode);

  applyBaseLayer(originalSlpTemplate);

  const slpTemplate: SLPTemplate = {
    ...originalSlpTemplate,
    root: type == "source" || type == "build",
    module: moduleNode.name,
    packageLocation: moduleNode.packageLocation,
    keywordPaths: null,
    original: cloneDeep(originalSlpTemplate)
  };

  updateKeywordPathsInSLPTemplate(slpTemplate);
  return slpTemplate;
};

export const baseModuleName = "@somod/slp";
export const baseLayerName = "baseLayer";

export const loadBaseSlpTemplate = async (
  dir: string
): Promise<SLPTemplate> => {
  const toBeBundledLibraries = await getToBeBundledLibraries(dir, "slp");

  const originalSlpTemplate: OriginalSLPTemplate = {
    Resources: {
      [baseLayerName]: {
        Type: "AWS::Serverless::LayerVersion",
        Metadata: {
          BuildMethod: "nodejs14.x",
          BuildArchitecture: "arm64"
        },
        [KeywordSLPOutput]: { default: true, attributes: [] },
        Properties: {
          LayerName: { [KeywordSLPResourceName]: baseLayerName },
          Description:
            "Set of npm libraries to be requiired in all Lambda funtions",
          CompatibleArchitectures: ["arm64"],
          CompatibleRuntimes: ["nodejs14.x"],
          RetentionPolicy: "Delete",
          [KeywordSLPFunctionLayerLibraries]: toBeBundledLibraries
        }
      } as SLPResource
    }
  };

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

export const loadSLPTemplates = async (
  modules: ModuleNode[],
  types: SLPTemplateType[] = []
): Promise<SLPTemplate[]> => {
  let slpTemplates = await Promise.all(
    modules.map(async (module, i) => {
      try {
        return await loadSLPTemplate(module, types[i] || "dependent");
      } catch (e) {
        if (e instanceof NoSLPTemplateError) {
          return false;
        } else {
          throw e;
        }
      }
    })
  );

  slpTemplates = slpTemplates.filter(slpTemplate => !!slpTemplate);
  return slpTemplates as SLPTemplate[];
};

export const mergeSLPTemplates = (
  slpTemplates: SLPTemplate[]
): ServerlessTemplate => {
  const serverlessTemplate: Record<string, SLPTemplate> = {};

  slpTemplates.forEach(slpTemplate => {
    serverlessTemplate[slpTemplate.module] = slpTemplate;
  });

  return serverlessTemplate;
};

export const buildRootSLPTemplate = async (
  rootModuleNode: ModuleNode
): Promise<void> => {
  const originalSLPTemplate = await loadSourceSLPTemplate(rootModuleNode);

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
