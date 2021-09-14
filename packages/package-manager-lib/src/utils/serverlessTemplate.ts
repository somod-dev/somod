import { ErrorSet } from "@sodaru-cli/base";
import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dump } from "js-yaml";
import {
  cloneDeep,
  isArray,
  isPlainObject,
  isUndefined,
  mergeWith
} from "lodash";
import { join, dirname } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_functions,
  path_lambdas,
  path_serverless,
  path_slpWorkingDir
} from "..";
import {
  checkForRepeatedModules,
  getModuleGraph,
  ModuleNode,
  toList
} from "./module";

export type ServerlessTemplate = Record<string, SLPTemplate>;

type SLPTemplate = {
  Parameters: Record<string, { SAMType: string; schema: unknown }>;
  Resources: Record<string, SLPResource>;
  slpResourceNamePaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::ResourceName
  slpRefPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Ref
  slpRefParameterPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::RefParameter
  slpFunctionPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Function
};

type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
  "SLP::Extend"?: { module: string; resource: string };
  "SLP::DependsOn"?: { module: string; resource: string }[];
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

// Note : In Template schema only function name is allowed, it is assumed that module is current module
type SLPFunction = {
  "SLP::Function": {
    module: string;
    function: string;
  };
};

type SLPResourceName = {
  "SLP::ResourceName": string;
};

type SAMTemplate = {
  Parameters: Record<string, { Type: string }>;
  Resources: Record<
    string,
    { Type: string; DependsOn?: string[]; Properties: Record<string, unknown> }
  >;
};

const KeywordSLPResourceName = "SLP::ResourceName";
const KeywordSLPRef = "SLP::Ref";
const KeywordSLPRefParameter = "SLP::RefParameter";
const KeywordSLPFunction = "SLP::Function";

type SLPKeywords = Pick<
  SLPTemplate,
  | "slpResourceNamePaths"
  | "slpRefPaths"
  | "slpRefParameterPaths"
  | "slpFunctionPaths"
>;

const getSLPKeywords = (chunk: unknown): SLPKeywords => {
  const keyWords: SLPKeywords = {
    slpResourceNamePaths: [],
    slpRefPaths: [],
    slpRefParameterPaths: [],
    slpFunctionPaths: []
  };
  if (isPlainObject(chunk)) {
    if (!isUndefined(chunk[KeywordSLPResourceName])) {
      keyWords.slpResourceNamePaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRef])) {
      keyWords.slpRefPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRefParameter])) {
      keyWords.slpRefParameterPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPFunction])) {
      keyWords.slpFunctionPaths.push([]);
    } else {
      Object.keys(chunk).forEach(key => {
        const childKeywords = getSLPKeywords(chunk[key]);
        [
          "slpResourceNamePaths",
          "slpRefPaths",
          "slpRefParameterPaths",
          "slpFunctionPaths"
        ].forEach(paths => {
          childKeywords[paths].forEach((keywordPaths: string[]) => {
            keywordPaths.unshift(key);
            keyWords[paths].push(keywordPaths);
          });
        });
      });
    }
  } else if (isArray(chunk)) {
    chunk.forEach((arrayItem, index) => {
      const childKeywords = getSLPKeywords(arrayItem);
      [
        "slpResourceNamePaths",
        "slpRefPaths",
        "slpRefParameterPaths",
        "slpFunctionPaths"
      ].forEach(paths => {
        childKeywords[paths].forEach((keywordPaths: string[]) => {
          keywordPaths.unshift(index + "");
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
  return cloneDeep(keyword);
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
      dependsOn.forEach(_dependsOn => {
        const moduleTemplate = _dependsOn.module
          ? serverlessTemplate[_dependsOn.module]
          : slpTemplate;
        if (
          !(moduleTemplate && moduleTemplate.Resources[_dependsOn.resource])
        ) {
          errors.push(
            new Error(
              `Dependent module resource {${_dependsOn.module || module}, ${
                _dependsOn.resource
              }} not found. Depended from {${module}, ${resourceLogicalId}}`
            )
          );
        }
      });
    }
  });

  slpTemplate.slpRefPaths.forEach(refPath => {
    const reference = getSLPKeyword(slpTemplate, refPath) as SLPRef;
    const ref = reference["SLP::Ref"];
    const moduleTemplate: SLPTemplate = ref.module
      ? serverlessTemplate[ref.module]
      : slpTemplate;

    if (!(moduleTemplate && moduleTemplate.Resources[ref.resource])) {
      errors.push(
        Error(
          `Referenced module resource {${ref.module}, ${
            ref.resource
          }} not found. Referenced in "${module}" at "Resources/${refPath.join(
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
          }} does not have SLP::Output. Referenced in "${module}" at "Resources/${refPath.join(
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
            } in SLP::Output. Referenced in "${module}" at "Resources/${refPath.join(
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
            }} does not have default set to true in SLP::Output. Referenced in "${module}" at "Resources/${refPath.join(
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

const updateSLPFunctionWithModule = (
  moduleName: string,
  slpTemplate: SLPTemplate
): void => {
  slpTemplate.slpFunctionPaths.forEach(functionPaths => {
    const _function = getSLPKeyword(slpTemplate, functionPaths) as {
      [KeywordSLPFunction]: string;
    };

    const slpFunction: SLPFunction = {
      "SLP::Function": {
        module: moduleName,
        function: _function[KeywordSLPFunction]
      }
    };

    replaceSLPKeyword(slpTemplate, functionPaths, slpFunction);
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
        "slpFunctionPaths"
      ].forEach(
        (
          pathsKey:
            | "slpRefPaths"
            | "slpRefParameterPaths"
            | "slpResourceNamePaths"
            | "slpFunctionPaths"
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
      updateSLPFunctionWithModule(_moduleNode.name, slpTemplate);
      updateServerlessTemplate(
        _moduleNode.name,
        serverlessTemplate,
        slpTemplate
      );
    }
  }
  return serverlessTemplate;
};

const hash = (str: string): string => {
  return createHash("sha256").update(str).digest("hex").substr(0, 8);
};

const resolveParameterName = (
  moduleName: string,
  parameterName: string
): string => {
  return "p" + hash(moduleName) + parameterName;
};

const resolveResourceLogicalId = (
  moduleName: string,
  resourceId: string
): string => {
  return "r" + hash(moduleName) + resourceId;
};

const resolveResourceName = (
  moduleName: string,
  resourceName: string
): unknown => {
  return {
    "Fn::Join": [
      "",
      [
        "slp",
        {
          "Fn::Select": [2, { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }]
        },
        hash(moduleName) + resourceName
      ]
    ]
  };
};

const resolveFunctionLocation = async (
  dir: string,
  slpFunction: SLPFunction
): Promise<string> => {
  const { module, function: _function } = slpFunction["SLP::Function"];
  const functionPath = join(
    dir,
    path_slpWorkingDir,
    path_functions,
    module,
    _function + ".js"
  );
  const functionCode = `export { ${_function} as default } from "${module}"`;
  const functionDir = dirname(functionPath);
  await mkdir(functionDir, { recursive: true });
  await writeFile(functionPath, functionCode);
  return `${path_slpWorkingDir}/${path_lambdas}/${module}/${_function}`;
};

const _generateSAMTemplate = async (
  dir: string,
  serverlessTemplate: ServerlessTemplate
): Promise<SAMTemplate> => {
  const samTemplate: SAMTemplate = {
    Parameters: {},
    Resources: {}
  };

  await Promise.all(
    Object.keys(serverlessTemplate).map(async moduleName => {
      const slpTemplate = serverlessTemplate[moduleName];
      if (slpTemplate.Parameters) {
        Object.keys(slpTemplate.Parameters).forEach(paramName => {
          const parameter = slpTemplate.Parameters[paramName];
          samTemplate.Parameters[resolveParameterName(moduleName, paramName)] =
            {
              Type: parameter.SAMType
            };
        });
      }

      // resolve SLP::Function
      await Promise.all(
        slpTemplate.slpFunctionPaths.map(async functionPath => {
          const slpFunction = getSLPKeyword(
            slpTemplate,
            functionPath
          ) as SLPFunction;
          const functionLocation = await resolveFunctionLocation(
            dir,
            slpFunction
          );
          replaceSLPKeyword(slpTemplate, functionPath, functionLocation);
        })
      );

      // resolve SLP::ResourceName
      slpTemplate.slpResourceNamePaths.forEach(resourceNamePath => {
        const slpResourceName = getSLPKeyword(
          slpTemplate,
          resourceNamePath
        ) as SLPResourceName;
        replaceSLPKeyword(
          slpTemplate,
          resourceNamePath,
          resolveResourceName(moduleName, slpResourceName["SLP::ResourceName"])
        );
      });

      // resolve SLP::Ref
      slpTemplate.slpRefPaths.forEach(refPath => {
        const slpRef = getSLPKeyword(slpTemplate, refPath) as SLPRef;
        if (!slpRef["SLP::Ref"].module) {
          slpRef["SLP::Ref"].module = moduleName;
        }
        const resourceId = resolveResourceLogicalId(
          slpRef["SLP::Ref"].module,
          slpRef["SLP::Ref"].resource
        );
        if (slpRef["SLP::Ref"].attribute) {
          const getAtt = {
            "Fn::GetAtt": [resourceId, slpRef["SLP::Ref"].attribute]
          };
          replaceSLPKeyword(slpTemplate, refPath, getAtt);
        } else {
          const ref = {
            Ref: resourceId
          };
          replaceSLPKeyword(slpTemplate, refPath, ref);
        }
      });

      // resolve SLP::RefParameter
      slpTemplate.slpRefParameterPaths.forEach(refParameterPath => {
        const slpRefParameter = getSLPKeyword(
          slpTemplate,
          refParameterPath
        ) as SLPRefParameter;
        if (!slpRefParameter["SLP::RefParameter"].module) {
          slpRefParameter["SLP::RefParameter"].module = moduleName;
        }

        const ref = {
          Ref: resolveParameterName(
            slpRefParameter["SLP::RefParameter"].module,
            slpRefParameter["SLP::RefParameter"].parameter
          )
        };
        replaceSLPKeyword(slpTemplate, refParameterPath, ref);
      });

      Object.keys(slpTemplate.Resources).forEach(resourceId => {
        const resourceLogicalId = resolveResourceLogicalId(
          moduleName,
          resourceId
        );
        const resource = slpTemplate.Resources[resourceId];
        const samResource: SAMTemplate["Resources"][string] = {
          Type: resource.Type,
          Properties: resource.Properties
        };
        if (resource["SLP::DependsOn"]) {
          samResource.DependsOn = resource["SLP::DependsOn"].map(_dependsOn => {
            return resolveResourceLogicalId(
              _dependsOn.module || moduleName,
              _dependsOn.resource
            );
          });
        }
        samTemplate.Resources[resourceLogicalId] = samResource;
      });
    })
  );

  return samTemplate;
};

export const generateSAMTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const allModuleNodes = toList(rootModuleNode);
  checkForRepeatedModules(allModuleNodes);
  const serverlessTemplate = await generateServerlessTemplate(rootModuleNode);
  const samTemplate = await _generateSAMTemplate(dir, serverlessTemplate);

  const completeSamTemplate = {
    AWSTemplateFormatVersion: "2010-09-09",
    Transform: "AWS::Serverless-2016-10-31",
    Globals: {
      Function: {
        Runtime: "nodejs14.x",
        Handler: "index.handler"
      }
    },
    ...samTemplate
  };

  const templateYamlPath = join(dir, file_templateYaml);

  const templateStr = dump(completeSamTemplate);

  await writeFile(templateYamlPath, templateStr);
};
