import {
  ErrorSet,
  saveJsonFileStore,
  unixStylePath,
  updateJsonFileStore
} from "@sodaru-cli/base";
import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { load } from "js-yaml";
import {
  cloneDeep,
  isArray,
  isPlainObject,
  isUndefined,
  mergeWith
} from "lodash";
import { join, dirname, relative } from "path";
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

const KeywordSLPExtend = "SLP::Extend";
const KeywordSLPDependsOn = "SLP::DependsOn";
const KeywordSLPOutput = "SLP::Output";
const KeywordSLPResourceName = "SLP::ResourceName";
const KeywordSLPRef = "SLP::Ref";
const KeywordSLPRefParameter = "SLP::RefParameter";
const KeywordSLPFunction = "SLP::Function";

type ServerlessTemplate = Record<string, SLPTemplate>;

type OriginalSLPTemplate = {
  Parameters: Record<string, { SAMType: string; schema: unknown }>;
  Resources: Record<string, SLPResource>;
};

type SLPKeywordPaths = {
  slpResourceNamePaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::ResourceName
  slpRefPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Ref
  slpRefParameterPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::RefParameter
  slpFunctionPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Function
};

const SLPKeywordPathsKeys: (keyof SLPKeywordPaths)[] = [
  "slpResourceNamePaths",
  "slpRefPaths",
  "slpRefParameterPaths",
  "slpFunctionPaths"
];

type SLPTemplate = OriginalSLPTemplate & SLPKeywordPaths;

type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
  [KeywordSLPExtend]?: { module: string; resource: string };
  [KeywordSLPDependsOn]?: { module: string; resource: string }[];
  [KeywordSLPOutput]?: { default: boolean; attributes: string[] };
};

type SLPRef = {
  [KeywordSLPRef]: {
    resource: string;
    module?: string;
    attribute?: string;
  };
};

type SLPRefParameter = {
  [KeywordSLPRefParameter]: {
    parameter: string;
    module?: string;
  };
};

type OriginalSLPFunction = {
  [KeywordSLPFunction]: string;
};

// Note : In Template schema only function name is allowed, it is assumed that module is current module
type SLPFunction = {
  [KeywordSLPFunction]: {
    module: string;
    function: string;
  };
};

type SLPResourceName = {
  [KeywordSLPResourceName]: string;
};

type SAMTemplate = {
  Parameters: Record<string, { Type: string }>;
  Resources: Record<
    string,
    { Type: string; DependsOn?: string[]; Properties: Record<string, unknown> }
  >;
};

const getSLPKeywords = (chunk: unknown): SLPKeywordPaths => {
  const keyWords: SLPKeywordPaths = {
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
        SLPKeywordPathsKeys.forEach(paths => {
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
      SLPKeywordPathsKeys.forEach(paths => {
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
  slpTemplate: OriginalSLPTemplate
): SLPTemplate => {
  const slpKeywords = getSLPKeywords(slpTemplate.Resources);
  return { ...slpTemplate, ...slpKeywords };
};

const getSLPTemplate = async (path: string): Promise<SLPTemplate> => {
  const slpTemplateStr = await readFile(path, { encoding: "utf8" });
  // the schema for slpTemplate is @sodaru-cli/serverless-schema/schemas/index.json
  const slpTemplate: OriginalSLPTemplate = JSON.parse(slpTemplateStr);
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

const validateSlpResourceExtend = (
  module: string,
  resourceLogicalId: string,
  resource: SLPResource,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];
  const extend = resource[KeywordSLPExtend];
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
  return errors;
};

const validateSLPResourceDependsOn = (
  module: string,
  resourceLogicalId: string,
  resource: SLPResource,
  serverlessTemplate: ServerlessTemplate,
  slpTemplate: SLPTemplate
): Error[] => {
  const errors: Error[] = [];

  const dependsOn = resource[KeywordSLPDependsOn];
  if (dependsOn) {
    dependsOn.forEach(_dependsOn => {
      const moduleTemplate = _dependsOn.module
        ? serverlessTemplate[_dependsOn.module]
        : slpTemplate;
      if (!(moduleTemplate && moduleTemplate.Resources[_dependsOn.resource])) {
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

  return errors;
};

const validateSLPTemplateRefs = (
  module: string,
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.slpRefPaths.forEach(refPath => {
    const reference = getSLPKeyword(slpTemplate, refPath) as SLPRef;
    const ref = reference[KeywordSLPRef];
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

    if (!moduleTemplate.Resources[ref.resource][KeywordSLPOutput]) {
      errors.push(
        new Error(
          `Referenced module resource {${ref.module}, ${
            ref.resource
          }} does not have ${KeywordSLPOutput}. Referenced in "${module}" at "Resources/${refPath.join(
            "/"
          )}"`
        )
      );
      return;
    }

    if (ref.attribute) {
      if (
        !moduleTemplate.Resources[ref.resource][
          KeywordSLPOutput
        ].attributes.includes(ref.attribute)
      ) {
        errors.push(
          new Error(
            `Referenced module resource {${ref.module}, ${
              ref.resource
            }} does not have attribute ${
              ref.attribute
            } in ${KeywordSLPOutput}. Referenced in "${module}" at "Resources/${refPath.join(
              "/"
            )}"`
          )
        );
        return;
      }
    } else {
      if (!moduleTemplate.Resources[ref.resource][KeywordSLPOutput].default) {
        errors.push(
          new Error(
            `Referenced module resource {${ref.module}, ${
              ref.resource
            }} does not have default set to true in ${KeywordSLPOutput}. Referenced in "${module}" at "Resources/${refPath.join(
              "/"
            )}"`
          )
        );
        return;
      }
    }
  });

  return errors;
};

const validateSLPTemplateRefParameters = (
  module: string,
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.slpRefParameterPaths.forEach(refParameterPath => {
    const referenceParameter = getSLPKeyword(
      slpTemplate,
      refParameterPath
    ) as SLPRefParameter;
    const refParameter = referenceParameter[KeywordSLPRefParameter];

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

  return errors;
};

const validateSLPTemplateFunctions = (
  dir: string,
  module: string,
  slpTemplate: SLPTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.slpFunctionPaths.forEach(functionPath => {
    const slpFunction = getSLPKeyword(
      slpTemplate,
      functionPath
    ) as OriginalSLPFunction;
    const functionName = slpFunction[KeywordSLPFunction];
    const functionFilePath = join(
      dir,
      path_serverless,
      path_functions,
      functionName + ".ts"
    );
    if (!existsSync(functionFilePath)) {
      errors.push(
        new Error(
          `Referenced module function {${module}, ${functionName}} not found. Looked for file "${unixStylePath(
            functionFilePath
          )}". Referenced in "${module}" at "Resources/${functionPath.join(
            "/"
          )}"`
        )
      );
    }
  });

  return errors;
};

const validateSlpTemplate = (
  dir: string,
  module: string,
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): void => {
  const errors: Error[] = [];
  Object.keys(slpTemplate.Resources).forEach(resourceLogicalId => {
    const resource = slpTemplate.Resources[resourceLogicalId];
    errors.push(
      ...validateSlpResourceExtend(
        module,
        resourceLogicalId,
        resource,
        serverlessTemplate
      )
    );

    errors.push(
      ...validateSLPResourceDependsOn(
        module,
        resourceLogicalId,
        resource,
        serverlessTemplate,
        slpTemplate
      )
    );
  });

  errors.push(
    ...validateSLPTemplateRefs(module, slpTemplate, serverlessTemplate)
  );

  errors.push(
    ...validateSLPTemplateRefParameters(module, slpTemplate, serverlessTemplate)
  );

  errors.push(...validateSLPTemplateFunctions(dir, module, slpTemplate));

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};

const updateSLPFunctionWithModule = (
  moduleName: string,
  slpTemplate: SLPTemplate
): void => {
  slpTemplate.slpFunctionPaths.forEach(functionPaths => {
    const _function = getSLPKeyword(
      slpTemplate,
      functionPaths
    ) as OriginalSLPFunction;

    const slpFunction: SLPFunction = {
      [KeywordSLPFunction]: {
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
  updateSLPFunctionWithModule(module, slpTemplate);

  const resources: SLPTemplate["Resources"] = {};
  Object.keys(slpTemplate.Resources).forEach(resourceLogicalId => {
    const resource = slpTemplate.Resources[resourceLogicalId];
    const extend = resource[KeywordSLPExtend];
    if (extend) {
      delete resource[KeywordSLPExtend];
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
      SLPKeywordPathsKeys.forEach(pathsKey => {
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
      });
      // MOVE-PATHS :- END
    } else {
      resources[resourceLogicalId] = resource;
    }
  });
  slpTemplate.Resources = resources;
  serverlessTemplate[module] = slpTemplate;
};

const generateServerlessTemplate = async (
  moduleNode: ModuleNode,
  includeRoot = false
): Promise<ServerlessTemplate> => {
  const serverlessTemplate: ServerlessTemplate = {};
  const moduleNodes = getOrderOfTraversal(moduleNode);
  const length = includeRoot ? moduleNodes.length : moduleNodes.length - 1;
  for (let i = 0; i < length; i++) {
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
      updateServerlessTemplate(
        _moduleNode.name,
        serverlessTemplate,
        slpTemplate
      );
    }
  }
  return serverlessTemplate;
};

const getRootOriginalSlpTemplate = async (
  dir: string
): Promise<OriginalSLPTemplate> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (!existsSync(templateYamlPath)) {
    throw new Error(`file "${templateYamlPath}" does not exist`);
  }
  const templateYamlContent = await readFile(templateYamlPath, {
    encoding: "utf8"
  });
  const rootSlpTemplate = load(templateYamlContent) as OriginalSLPTemplate;
  return rootSlpTemplate;
};

export const buildTemplateJson = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const allModuleNodes = toList(rootModuleNode);
  checkForRepeatedModules(allModuleNodes);
  const serverlessTemplate = await generateServerlessTemplate(rootModuleNode);
  const originalRootSlpTemplate = await getRootOriginalSlpTemplate(dir);
  const rootSlpTemplate = parseSLPTemplateForSLPKeywords(
    cloneDeep(originalRootSlpTemplate)
  );
  validateSlpTemplate(
    dir,
    rootModuleNode.name,
    rootSlpTemplate,
    serverlessTemplate
  );
  const templateJsonPath = join(
    dir,
    path_build,
    path_serverless,
    file_templateJson
  );
  const templateJsonDir = dirname(templateJsonPath);
  await mkdir(templateJsonDir, { recursive: true });
  updateJsonFileStore(templateJsonPath, originalRootSlpTemplate);
  await saveJsonFileStore(templateJsonPath);
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
  slpFunction: SLPFunction,
  rootModuleName: string
): Promise<string> => {
  const { module, function: _function } = slpFunction[KeywordSLPFunction];
  const functionPath = join(
    dir,
    path_slpWorkingDir,
    path_functions,
    module,
    _function + ".js"
  );

  let exportFrom = module;
  if (module == rootModuleName) {
    const rootModuleEntryPoint = join(dir, path_build);
    exportFrom = relative(dirname(functionPath), rootModuleEntryPoint)
      .split("\\")
      .join("/");
  }

  const functionCode = `export { ${_function} as default } from "${exportFrom}";`;
  const functionDir = dirname(functionPath);
  await mkdir(functionDir, { recursive: true });
  await writeFile(functionPath, functionCode);
  return `${path_slpWorkingDir}/${path_lambdas}/${module}/${_function}`;
};

const _generateSAMTemplate = async (
  dir: string,
  serverlessTemplate: ServerlessTemplate,
  rootModuleName: string
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
            slpFunction,
            rootModuleName
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
          resolveResourceName(
            moduleName,
            slpResourceName[KeywordSLPResourceName]
          )
        );
      });

      // resolve SLP::Ref
      slpTemplate.slpRefPaths.forEach(refPath => {
        const slpRef = getSLPKeyword(slpTemplate, refPath) as SLPRef;
        if (!slpRef[KeywordSLPRef].module) {
          slpRef[KeywordSLPRef].module = moduleName;
        }
        const resourceId = resolveResourceLogicalId(
          slpRef[KeywordSLPRef].module,
          slpRef[KeywordSLPRef].resource
        );
        if (slpRef[KeywordSLPRef].attribute) {
          const getAtt = {
            "Fn::GetAtt": [resourceId, slpRef[KeywordSLPRef].attribute]
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
        if (!slpRefParameter[KeywordSLPRefParameter].module) {
          slpRefParameter[KeywordSLPRefParameter].module = moduleName;
        }

        const ref = {
          Ref: resolveParameterName(
            slpRefParameter[KeywordSLPRefParameter].module,
            slpRefParameter[KeywordSLPRefParameter].parameter
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
        if (resource[KeywordSLPDependsOn]) {
          samResource.DependsOn = resource[KeywordSLPDependsOn].map(
            _dependsOn => {
              return resolveResourceLogicalId(
                _dependsOn.module || moduleName,
                _dependsOn.resource
              );
            }
          );
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
): Promise<SAMTemplate> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);
  const serverlessTemplate = await generateServerlessTemplate(
    rootModuleNode,
    true
  );
  const samTemplate = await _generateSAMTemplate(
    dir,
    serverlessTemplate,
    rootModuleNode.name
  );

  return samTemplate;
};
