import { ErrorSet } from "@sodaru-cli/base";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import {
  cloneDeep,
  isArray,
  isPlainObject,
  isUndefined,
  mergeWith
} from "lodash";
import { join } from "path";
import { file_templateJson, path_build, path_serverless } from "..";
import { ModuleNode } from "./module";

export type ServerlessTemplate = Record<string, SLPTemplate>;

type SLPTemplate = {
  Parameters: Record<string, { SAMType: string; schema: unknown }>;
  Resources: Record<string, SLPResource>;
  slpResourceNamePaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::ResourceName
  slpRefPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Ref
  slpRefParameterPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::RefParameter
  slpLocationPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Location
};

type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
  "SLP::Extend"?: { module: string; resource: string };
  "SLP::DependsOn"?: { module: string; resource: string };
  "SLP::Output"?: { default: boolean; attributes: string[] };
};

type SLPRef = {
  "SLP::Ref": {
    resource: string;
    module?: string;
    attribute?: string;
  };
};

type SLPRefParameter = {
  "SLP::RefParameter": {
    parameter: string;
    module?: string;
  };
};

type SLPLocation = {
  "SLP::Location": string;
};

// TODO: remove next line
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SLPResourceName = {
  "SLP::ResourceName": string;
};

const KeywordSLPResourceName = "SLP::ResourceName";
const KeywordSLPRef = "SLP::Ref";
const KeywordSLPRefParameter = "SLP::RefParameter";
const KeywordSLPLocation = "SLP::Location";

type SLPKeywords = Pick<
  SLPTemplate,
  | "slpResourceNamePaths"
  | "slpRefPaths"
  | "slpRefParameterPaths"
  | "slpLocationPaths"
>;

const getSLPKeywords = (chunk: unknown): SLPKeywords => {
  const keyWords: SLPKeywords = {
    slpResourceNamePaths: [],
    slpRefPaths: [],
    slpRefParameterPaths: [],
    slpLocationPaths: []
  };
  if (isPlainObject(chunk)) {
    if (!isUndefined(chunk[KeywordSLPResourceName])) {
      keyWords.slpResourceNamePaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRef])) {
      keyWords.slpRefPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRefParameter])) {
      keyWords.slpRefParameterPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPLocation])) {
      keyWords.slpLocationPaths.push([]);
    } else {
      Object.keys(chunk).forEach(key => {
        const childKeywords = getSLPKeywords(chunk[key]);
        [
          "slpResourceNamePaths",
          "slpRefPaths",
          "slpRefParameterPaths",
          "slpLocationPaths"
        ].forEach(paths => {
          childKeywords[paths].forEach((keywordPaths: string[]) => {
            keywordPaths.unshift(key);
            keyWords[paths].push(keywordPaths);
          });
        });
      });
    }
  } else if (isArray(chunk)) {
    chunk.forEach(index => {
      const childKeywords = getSLPKeywords(chunk[index]);
      [
        "slpResourceNamePaths",
        "slpRefPaths",
        "slpRefParameterPaths",
        "slpLocationPaths"
      ].forEach(paths => {
        childKeywords[paths].forEach((keywordPaths: string[]) => {
          keywordPaths.unshift(index);
          keyWords[paths].push(keywordPaths);
        });
      });
    });
  }
  return keyWords;
};

const parseSLPTemplateForSLPKeywords = (
  slpTemplate: Pick<SLPTemplate, "Parameters" | "Resources">
): SLPTemplate => {
  const slpKeywords = getSLPKeywords(slpTemplate.Resources);
  return { ...slpTemplate, ...slpKeywords };
};

const getSLPTemplate = async (path: string): Promise<SLPTemplate> => {
  const slpTemplateStr = await readFile(path, { encoding: "utf8" });
  // the schema for slpTemplate is @sodaru-cli/serverless-schema/schemas/index.json
  const slpTemplate: Pick<SLPTemplate, "Parameters" | "Resources"> =
    JSON.parse(slpTemplateStr);
  return parseSLPTemplateForSLPKeywords(slpTemplate);
};

const getSLPKeyword = (slpTemplate: SLPTemplate, paths: string[]): unknown => {
  let keyword: unknown = slpTemplate.Resources;
  paths.forEach(path => {
    keyword = keyword[path];
  });
  return keyword;
};

const replaceSLPKeyword = (
  slpTemplate: SLPTemplate,
  paths: string[],
  newValue: unknown
): void => {
  let keyword: unknown = slpTemplate.Resources;
  const _paths = [...paths];
  const lastPath = _paths.pop();
  _paths.forEach(path => {
    keyword = keyword[path];
  });
  keyword[lastPath] = newValue;
};

/**
 * returns the Depth First Traversal order , i.e., All child first before root
 */
const getOrderOfTraversal = (moduleNode: ModuleNode): ModuleNode[] => {
  const toBeParsed: ModuleNode[] = [moduleNode];
  const parsed: ModuleNode[] = [];

  while (toBeParsed.length > 0) {
    const currentNode = toBeParsed.pop();
    currentNode.dependencies.forEach(child => toBeParsed.push(child));
    parsed.unshift(currentNode);
  }

  return parsed;
};

const validateSlpTemplate = (
  module: string,
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): void => {
  const errors: Error[] = [];
  Object.keys(slpTemplate.Resources).forEach(resourceLogicalId => {
    const resource = slpTemplate.Resources[resourceLogicalId];
    const extend = resource["SLP::Extend"];
    if (extend) {
      if (
        !(
          serverlessTemplate[extend.module] &&
          serverlessTemplate[extend.module].Resources[extend.resource]
        )
      ) {
        errors.push(
          new Error(
            `Extended module resource {${extend.module}, ${extend.resource}} not found. Extended in {${module}, ${resourceLogicalId}}`
          )
        );
      }
    }

    const dependsOn = resource["SLP::DependsOn"];
    if (dependsOn) {
      if (
        !(
          serverlessTemplate[dependsOn.module] &&
          serverlessTemplate[dependsOn.module].Resources[dependsOn.resource]
        )
      ) {
        errors.push(
          new Error(
            `Dependent module resource {${dependsOn.module}, ${dependsOn.resource}} not found. Depended from {${module}, ${resourceLogicalId}}`
          )
        );
      }
    }
  });

  slpTemplate.slpRefPaths.forEach(refPath => {
    const reference = getSLPKeyword(slpTemplate, refPath) as SLPRef;
    const ref = reference["SLP::Ref"];
    let moduleTemplate: SLPTemplate = slpTemplate;
    if (ref.module) {
      moduleTemplate = serverlessTemplate[ref.module];
    }
    if (!(moduleTemplate && moduleTemplate.Resources[ref.resource])) {
      errors.push(
        Error(
          `Referenced module resource {${ref.module}, ${
            ref.resource
          }} not found, Referenced in "${module}" at "Resources/${refPath.join(
            "/"
          )}"`
        )
      );
      return;
    }

    if (!moduleTemplate.Resources[ref.resource]["SLP::Output"]) {
      errors.push(
        new Error(
          `Referenced module resource {${ref.module}, ${
            ref.resource
          }} does not have SLP::Output, Referenced in "${module}" at "Resources/${refPath.join(
            "/"
          )}"`
        )
      );
      return;
    }

    if (ref.attribute) {
      if (
        !moduleTemplate.Resources[ref.resource][
          "SLP::Output"
        ].attributes.includes(ref.attribute)
      ) {
        errors.push(
          new Error(
            `Referenced module resource {${ref.module}, ${
              ref.resource
            }} does not have attribute ${
              ref.attribute
            } in SLP::Output, Referenced in "${module}" at "Resources/${refPath.join(
              "/"
            )}"`
          )
        );
        return;
      }
    } else {
      if (!moduleTemplate.Resources[ref.resource]["SLP::Output"].default) {
        errors.push(
          new Error(
            `Referenced module resource {${ref.module}, ${
              ref.resource
            }} does not have default set to true in SLP::Output, Referenced in "${module}" at "Resources/${refPath.join(
              "/"
            )}"`
          )
        );
        return;
      }
    }
  });

  slpTemplate.slpRefParameterPaths.forEach(refParameterPath => {
    const referenceParameter = getSLPKeyword(
      slpTemplate,
      refParameterPath
    ) as SLPRefParameter;
    const refParameter = referenceParameter["SLP::RefParameter"];

    let moduleTemplate = slpTemplate;
    if (refParameter.module) {
      moduleTemplate = serverlessTemplate[refParameter.module];
    }

    if (
      !(
        moduleTemplate &&
        moduleTemplate.Parameters &&
        moduleTemplate.Parameters[refParameter.parameter]
      )
    ) {
      errors.push(
        Error(
          `Referenced module parameter {${refParameter.module}, ${
            refParameter.parameter
          }} not found. Referenced in "${module}" at "Resources/${refParameterPath.join(
            "/"
          )}"`
        )
      );
      return;
    }
  });

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};

const updateAbsoluteLocation = (
  packageLocation: string,
  slpTemplate: SLPTemplate
): void => {
  slpTemplate.slpLocationPaths.forEach(locationPaths => {
    const location = getSLPKeyword(slpTemplate, locationPaths) as SLPLocation;
    const relativeLocation = location["SLP::Location"];
    const absoluteLocation = join(
      packageLocation,
      path_build,
      path_serverless,
      relativeLocation
    );
    replaceSLPKeyword(slpTemplate, locationPaths, {
      "SLP::Location": absoluteLocation
    });
  });
};

const updateServerlessTemplate = (
  module: string,
  serverlessTemplate: ServerlessTemplate,
  slpTemplate: SLPTemplate
): void => {
  const resources: SLPTemplate["Resources"] = {};
  Object.keys(slpTemplate.Resources).forEach(resourceLogicalId => {
    const resource = slpTemplate.Resources[resourceLogicalId];
    const extend = resource["SLP::Extend"];
    if (extend) {
      delete resource["SLP::Extend"];
      const originalResource =
        serverlessTemplate[extend.module].Resources[extend.resource];
      const updatedResource = mergeWith(
        originalResource,
        resource,
        (objValue, srcValue) => {
          if (isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        }
      );
      serverlessTemplate[extend.module].Resources[extend.resource] =
        updatedResource;

      // MOVE-PATHS :- START
      [
        "slpRefPaths",
        "slpRefParameterPaths",
        "slpResourceNamePaths",
        "slpLocationPaths"
      ].forEach(
        (
          pathsKey:
            | "slpRefPaths"
            | "slpRefParameterPaths"
            | "slpResourceNamePaths"
            | "slpLocationPaths"
        ) => {
          const paths = slpTemplate[pathsKey];
          const originalPaths = serverlessTemplate[extend.module][pathsKey];
          slpTemplate[pathsKey] = paths.filter(_paths => {
            if (_paths[0] == resourceLogicalId) {
              _paths[0] = extend.resource;
              originalPaths.push(_paths);
              return false;
            }
            return true;
          });
        }
      );
      // MOVE-PATHS :- END
    } else {
      resources[resourceLogicalId] = resource;
    }
  });
  slpTemplate.Resources = resources;
  serverlessTemplate[module] = slpTemplate;
};

export const generateServerlessTemplate = async (
  moduleNode: ModuleNode
): Promise<ServerlessTemplate> => {
  const serverlessTemplate: ServerlessTemplate = {};
  const moduleNodes = getOrderOfTraversal(moduleNode);
  for (let i = 0; i < moduleNodes.length; i++) {
    const _moduleNode = moduleNodes[i];
    const packageLocation = _moduleNode.packageLocation;
    const templateJsonLocation = join(
      packageLocation,
      path_build,
      path_serverless,
      file_templateJson
    );
    if (existsSync(templateJsonLocation)) {
      const slpTemplate = await getSLPTemplate(templateJsonLocation);
      validateSlpTemplate(
        _moduleNode.name,
        cloneDeep(slpTemplate),
        cloneDeep(serverlessTemplate)
      );
      updateAbsoluteLocation(_moduleNode.packageLocation, slpTemplate);
      updateServerlessTemplate(
        _moduleNode.name,
        serverlessTemplate,
        slpTemplate
      );
    }
  }
  return serverlessTemplate;
};

/*
// TODO: uncomment this and continue further
export const generateSAMTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const allModuleNodes = toList(rootModuleNode);
  checkForRepeatedModules(allModuleNodes);
  const serverlessTemplate = generateServerlessTemplate(rootModuleNode);
};
*/
