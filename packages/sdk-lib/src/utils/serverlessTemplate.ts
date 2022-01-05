import { readJsonFileStore } from "@sodaru/cli-base";
import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import {
  cloneDeep,
  isArray,
  isPlainObject,
  isUndefined,
  mergeWith
} from "lodash";
import { dirname, join, relative } from "path";
import {
  file_lambdaBundleExclude,
  file_packageJson,
  file_templateJson,
  key_slpLambdaBundleExclude,
  path_build,
  path_functions,
  path_lambdas,
  path_lambda_layers,
  path_serverless,
  path_slpWorkingDir
} from "..";
import { getToBeBundledLibraries } from "./library";
import { getModuleGraph, ModuleNode } from "./module";

const KeywordSLPExtend = "SLP::Extend";
const KeywordSLPDependsOn = "SLP::DependsOn";
const KeywordSLPOutput = "SLP::Output";
const KeywordSLPResourceName = "SLP::ResourceName";
const KeywordSLPRef = "SLP::Ref";
const KeywordSLPRefParameter = "SLP::RefParameter";
const KeywordSLPRefResourceName = "SLP::RefResourceName";
const KeywordSLPFunction = "SLP::Function";
const KeywordSLPFunctionLayerLibraries = "SLP::FunctionLayerLibraries";

type ServerlessTemplate = Record<string, SLPTemplate>;

type OriginalSLPTemplate = {
  Parameters: Record<string, { SAMType: string; schema: unknown }>;
  Resources: Record<string, SLPResource>;
  packageLocation: string;
};

type SLPKeywordPaths = {
  slpResourceNamePaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::ResourceName
  slpRefPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Ref
  slpRefParameterPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::RefParameter
  slpRefResourceNamePaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::RefResourceName
  slpFunctionPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of SLP::Function
  slpFunctionLayerLibrariesPaths: string[][]; //list of JSON Paths relative to Resources for the occurances of KeywordSLPFunctionLayerLibraries
};

const SLPKeywordPathsKeys: (keyof SLPKeywordPaths)[] = [
  "slpResourceNamePaths",
  "slpRefPaths",
  "slpRefParameterPaths",
  "slpRefResourceNamePaths",
  "slpFunctionPaths",
  "slpFunctionLayerLibrariesPaths"
];

type SLPTemplate = OriginalSLPTemplate & SLPKeywordPaths;

type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
  [KeywordSLPExtend]?: { module: string; resource: string };
  [KeywordSLPDependsOn]?: { module?: string; resource: string }[];
  [KeywordSLPOutput]?: { default: boolean; attributes: string[] };
  DeletionPolicy?: string;
  UpdateReplacePolicy?: string;
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

type SLPRefResourceName = {
  [KeywordSLPRefResourceName]: {
    resource: string;
    property: string;
    module?: string;
  };
};

// Note : In Template schema only function name is allowed, it is assumed that module is current module
type SLPFunction = {
  [KeywordSLPFunction]: {
    module: string;
    function: string;
  };
};

type SLPFunctionLayerLibraries = {
  LayerName: SLPResourceName;
  CompatibleArchitectures: string[];
  CompatibleRuntimes: string[];
  RetentionPolicy: "Delete";
  Description: string;
  [KeywordSLPFunctionLayerLibraries]: Record<string, string>;
};

type SLPResourceName = {
  [KeywordSLPResourceName]: string;
};

type SAMTemplate = {
  Parameters: Record<string, { Type: string }>;
  Resources: Record<
    string,
    {
      Type: string;
      DependsOn?: string[];
      DeletionPolicy?: string;
      UpdateReplacePolicy?: string;
      Properties: Record<string, unknown>;
    }
  >;
};

const getSLPKeywords = (chunk: unknown): SLPKeywordPaths => {
  const keyWords: SLPKeywordPaths = {
    slpResourceNamePaths: [],
    slpRefPaths: [],
    slpRefParameterPaths: [],
    slpRefResourceNamePaths: [],
    slpFunctionPaths: [],
    slpFunctionLayerLibrariesPaths: []
  };
  if (isPlainObject(chunk)) {
    if (!isUndefined(chunk[KeywordSLPResourceName])) {
      keyWords.slpResourceNamePaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRef])) {
      keyWords.slpRefPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRefParameter])) {
      keyWords.slpRefParameterPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPRefResourceName])) {
      keyWords.slpRefResourceNamePaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPFunction])) {
      keyWords.slpFunctionPaths.push([]);
    } else if (!isUndefined(chunk[KeywordSLPFunctionLayerLibraries])) {
      keyWords.slpFunctionLayerLibrariesPaths.push([]);
    }

    Object.keys(chunk).forEach(key => {
      const childKeywords = getSLPKeywords(chunk[key]);
      SLPKeywordPathsKeys.forEach(paths => {
        childKeywords[paths].forEach((keywordPaths: string[]) => {
          keywordPaths.unshift(key);
          keyWords[paths].push(keywordPaths);
        });
      });
    });
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

/**
 * some of the slp keywords references the modulename , by default the module name is the current module of the SLP Template
 * fill the default value of modulename
 */
const updateDefaultModuleInSLPTemplate = (
  module: string,
  slpTemplate: SLPTemplate
): void => {
  // keywords that needs to fill the default value for module
  const pathsKeyToKeywordMap = {
    slpRefPaths: KeywordSLPRef,
    slpRefParameterPaths: KeywordSLPRefParameter,
    slpRefResourceNamePaths: KeywordSLPRefResourceName,
    slpFunctionPaths: KeywordSLPFunction
  };
  Object.keys(pathsKeyToKeywordMap).forEach(slpKeywordPathsKey => {
    const keyword = pathsKeyToKeywordMap[slpKeywordPathsKey];
    slpTemplate[slpKeywordPathsKey].forEach((slpKeywordPaths: string[]) => {
      const keywordValue = getSLPKeyword(slpTemplate, slpKeywordPaths);
      if (keyword == KeywordSLPFunction) {
        keywordValue[keyword] = {
          module,
          function: keywordValue[keyword]
        };
      } else if (keywordValue[keyword].module === undefined) {
        keywordValue[keyword].module = module;
      }
      replaceSLPKeyword(slpTemplate, slpKeywordPaths, keywordValue);
    });
  });

  Object.keys(slpTemplate.Resources).forEach(logicalResourceId => {
    const resource = slpTemplate.Resources[logicalResourceId];
    if (resource[KeywordSLPDependsOn]) {
      resource[KeywordSLPDependsOn].forEach(dependsOn => {
        if (dependsOn.module === undefined) {
          dependsOn.module = module;
        }
      });
    }
  });
};

const getSLPTemplate = async (
  module: string,
  path: string
): Promise<SLPTemplate> => {
  const slpTemplateStr = await readFile(path, { encoding: "utf8" });
  // the schema for slpTemplate is @sodaru/serverless-schema/schemas/index.json
  const originalSlpTemplate: OriginalSLPTemplate = JSON.parse(slpTemplateStr);
  originalSlpTemplate.packageLocation = join(path, "..", "..", ".."); // template path = packagelocation/build/serverless/template.json
  const slpTemplate = parseSLPTemplateForSLPKeywords(originalSlpTemplate);
  updateDefaultModuleInSLPTemplate(module, slpTemplate);
  return slpTemplate;
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

  const parsedModuleNames: string[] = [];

  const parsedUniq = parsed.filter(module => {
    if (parsedModuleNames.includes(module.name)) {
      return false;
    } else {
      parsedModuleNames.push(module.name);
      return true;
    }
  });

  return parsedUniq;
};

const updateServerlessTemplate = (
  module: string,
  serverlessTemplate: ServerlessTemplate,
  slpTemplate: SLPTemplate
): void => {
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
      const slpTemplate = await getSLPTemplate(
        _moduleNode.name,
        templateJsonLocation
      );
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

const resolveRefResourceName = (
  slpTemplate: SLPTemplate,
  resource: string,
  property: string
) => {
  const resourceNameProperty =
    slpTemplate.Resources[resource].Properties[property];

  return resourceNameProperty;
};

export const prepareFunctionToBundle = async (
  dir: string,
  module: string,
  rootModuleName: string,
  functionName: string
): Promise<void> => {
  const functionPath = join(
    dir,
    path_slpWorkingDir,
    path_functions,
    module,
    functionName + ".js"
  );

  let exportFrom = module;
  if (module == rootModuleName) {
    const rootModuleEntryPoint = join(dir, path_build);
    exportFrom = relative(dirname(functionPath), rootModuleEntryPoint)
      .split("\\")
      .join("/");
  }

  const functionCode = `export { ${functionName} as default } from "${exportFrom}";`;
  const functionDir = dirname(functionPath);
  await mkdir(functionDir, { recursive: true });
  await writeFile(functionPath, functionCode);
};

const resolveFunctionLocation = async (
  dir: string,
  slpFunction: SLPFunction,
  rootModuleName: string
): Promise<string> => {
  const { module, function: _function } = slpFunction[KeywordSLPFunction];
  await prepareFunctionToBundle(dir, module, rootModuleName, _function);
  return `${path_slpWorkingDir}/${path_lambdas}/${module}/${_function}`;
};

const prepareFunctionLayer = async (
  dir: string,
  module: string,
  name: string,
  dependencies: Record<string, string>
): Promise<void> => {
  const layerPackageJson = {
    name: module + "-" + name.toLowerCase(),
    version: "1.0.0",
    description: `Lambda function layer - ${name}`,
    dependencies
  };

  const layerPackageJsonPath = join(
    dir,
    path_slpWorkingDir,
    path_lambda_layers,
    module,
    name,
    file_packageJson
  );

  const destDir = dirname(layerPackageJsonPath);
  await mkdir(destDir, { recursive: true });
  await writeFile(
    layerPackageJsonPath,
    JSON.stringify(layerPackageJson, null, 2)
  );
};

const resolveFunctionLayer = async (
  dir: string,
  module: string,
  layerProperties: SLPFunctionLayerLibraries
): Promise<SLPResource["Properties"]> => {
  const _layerProperties = cloneDeep(
    layerProperties
  ) as SLPResource["Properties"];

  const layerName = layerProperties.LayerName[KeywordSLPResourceName];
  const dependencies = layerProperties[KeywordSLPFunctionLayerLibraries];
  await prepareFunctionLayer(dir, module, layerName, dependencies);

  _layerProperties.ContentUri = `${path_slpWorkingDir}/${path_lambda_layers}/${module}/${layerName}`;
  delete _layerProperties[KeywordSLPFunctionLayerLibraries];

  return _layerProperties;
};

const baseLayerName = "baseLayer";
const baseModuleName = "@somod/slp";

const getBaseLambdaLayer = async (
  dir: string
): Promise<SAMTemplate["Resources"][string]> => {
  const toBeBundledLibraries = await getToBeBundledLibraries(dir, "slp");
  const module = baseModuleName;
  const layerName = baseLayerName;
  const defaultLayer: SAMTemplate["Resources"][string] & {
    Metadata: Record<string, unknown>;
  } = {
    Type: "AWS::Serverless::LayerVersion",
    Metadata: {
      BuildMethod: "nodejs14.x",
      BuildArchitecture: "arm64"
    },
    Properties: {
      LayerName: resolveResourceName(module, layerName),
      Description:
        "Set of npm libraries to be requiired in all Lambda funtions",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      ContentUri: `${path_slpWorkingDir}/${path_lambda_layers}/${module}/${layerName}`
    }
  };

  await prepareFunctionLayer(dir, module, layerName, toBeBundledLibraries);

  return defaultLayer;
};

const convertServerlessTemplateIntoSAMTemplate = async (
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

      // resolve SLP::FunctionLayerLibraries
      // Layer version must be resolved before SLP::ResourceName , because LayerVersion uses the unresolved name for the layer
      await Promise.all(
        slpTemplate.slpFunctionLayerLibrariesPaths.map(
          async functionLayerPath => {
            const slpFunctionLayer = getSLPKeyword(
              slpTemplate,
              functionLayerPath
            ) as SLPFunctionLayerLibraries;
            const functionLayer = await resolveFunctionLayer(
              dir,
              rootModuleName,
              slpFunctionLayer
            );
            replaceSLPKeyword(slpTemplate, functionLayerPath, functionLayer);
          }
        )
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

      // resolve SLP::RefResourceName
      slpTemplate.slpRefResourceNamePaths.forEach(refResourceNamePath => {
        const slpRefResourceName = getSLPKeyword(
          slpTemplate,
          refResourceNamePath
        ) as SLPRefResourceName;
        const refResourceName = slpRefResourceName[KeywordSLPRefResourceName];
        if (!refResourceName.module) {
          refResourceName.module = moduleName;
        }

        const resourceName = resolveRefResourceName(
          serverlessTemplate[refResourceName.module],
          refResourceName.resource,
          refResourceName.property
        );
        replaceSLPKeyword(slpTemplate, refResourceNamePath, resourceName);
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

        // copy other resource attributes as is
        Object.keys(resource).forEach(resourceAttribute => {
          if (
            !["Type", "Properties", "DependsOn"].includes(resourceAttribute) &&
            !resourceAttribute.startsWith("SLP::")
          ) {
            samResource[resourceAttribute] = resource[resourceAttribute];
          }
        });

        samTemplate.Resources[resourceLogicalId] = samResource;
      });
    })
  );

  const baseLambdaLayer = await getBaseLambdaLayer(dir);
  const baseLayerId = resolveResourceLogicalId(baseModuleName, baseLayerName);
  samTemplate.Resources = {
    [baseLayerId]: baseLambdaLayer,
    ...samTemplate.Resources
  };

  Object.keys(samTemplate.Resources).forEach(resourceId => {
    if (samTemplate.Resources[resourceId].Type == "AWS::Serverless::Function") {
      const layers = (samTemplate.Resources[resourceId].Properties.Layers ||
        []) as { Ref: string }[];
      layers.unshift({ Ref: baseLayerId });
      samTemplate.Resources[resourceId].Properties.Layers = layers;
    }
  });

  return samTemplate;
};

const saveFunctionBundleExcludes = async (
  dir: string,
  rootModule: ModuleNode
): Promise<void> => {
  const excludes: Record<string, Record<string, string[]>> = {};

  const allModules = getOrderOfTraversal(rootModule);
  await Promise.all(
    allModules.map(async module => {
      const packageJsonPath = join(module.packageLocation, file_packageJson);
      const packageJson = await readJsonFileStore(packageJsonPath);
      if (isPlainObject(packageJson[key_slpLambdaBundleExclude])) {
        excludes[module.name] = packageJson[
          key_slpLambdaBundleExclude
        ] as Record<string, string[]>;
      }
    })
  );

  await mkdir(join(dir, path_slpWorkingDir), { recursive: true });

  await writeFile(
    join(dir, path_slpWorkingDir, file_lambdaBundleExclude),
    JSON.stringify(excludes)
  );
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
  await saveFunctionBundleExcludes(dir, rootModuleNode);
  const samTemplate = await convertServerlessTemplateIntoSAMTemplate(
    dir,
    serverlessTemplate,
    rootModuleNode.name
  );

  return samTemplate;
};
