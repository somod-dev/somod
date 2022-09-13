import { listFiles, unixStylePath } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import {
  JSONObjectNode,
  JSONObjectType,
  JSONPrimitiveNode,
  KeywordDefinition,
  ModuleTemplate
} from "somod-types";
import { existsSync } from "fs";
import { basename, extname, join } from "path";
import {
  custom_resource_prefix,
  path_build,
  path_functions,
  path_serverless,
  resourceType_Function
} from "../../constants";
import { constructJson, getPath } from "../../jsonTemplate";
import { ServerlessTemplate } from "../types";

type FunctionType = {
  name: string;
  exclude?: string[];
  customResources?: JSONObjectType;
};

const getDefinedFunctions = async (dir: string) => {
  const functionsDir = join(dir, path_serverless, path_functions);
  if (!existsSync(functionsDir)) {
    return [];
  }
  const files = await listFiles(functionsDir);
  const functions = files
    .filter(file => file.indexOf("/") == -1)
    .map(file => basename(file, extname(file)));
  return functions;
};

export const keywordFunction: KeywordDefinition<
  FunctionType,
  ServerlessTemplate
> = {
  keyword: "SOMOD::Function",

  getValidator: async rootDir => {
    const definedFunctions = await getDefinedFunctions(rootDir);
    return (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (
        !(
          path.length == 4 &&
          path[0] == "Resources" &&
          path[2] == "Properties" &&
          path[3] == "CodeUri" &&
          (
            (node.parent.node.parent.node as JSONObjectNode).properties
              ?.Type as JSONPrimitiveNode
          ).value == resourceType_Function
        )
      ) {
        errors.push(
          new Error(
            `${keyword} is allowed only as value of CodeUri property of ${resourceType_Function} resource`
          )
        );
      } else {
        //NOTE: structure of the value is validated by serverless-schema

        if (!definedFunctions.includes(value.name)) {
          errors.push(
            new Error(
              `Function ${value.name} not found. define under ${path_serverless}/${path_functions}`
            )
          );
        }
      }

      return errors;
    };
  },

  getProcessor:
    async (rootDir, moduleName, moduleContentMap) => (keyword, node, value) => {
      return {
        type: "object",
        value: unixStylePath(
          join(
            moduleContentMap[moduleName].location,
            path_build,
            path_serverless,
            path_functions,
            value.name
          )
        )
      };
    }
};

export const checkCustomResourceSchema = async (
  refNode: JSONObjectNode,
  targetTemplate: ModuleTemplate<ServerlessTemplate>,
  targetResource: string
): Promise<Error[]> => {
  const errors: Error[] = [];

  // assumption is that the existance of target resource is already verified

  const path = getPath(refNode);
  if (
    path.length == 4 &&
    path[0] == "Resources" &&
    path[2] == "Properties" &&
    path[3] == "ServiceToken" &&
    (
      (
        (refNode.parent.node.parent.node as JSONObjectNode).properties
          ?.Type as JSONPrimitiveNode
      ).value as string
    )?.startsWith(custom_resource_prefix)
  ) {
    // the ref node is referring a function which implements custom resource

    const customResourceNode = refNode.parent.node.parent.node;
    const customResource = constructJson(customResourceNode) as {
      Type: string;
      Properties: { ServiceToken?: unknown } & Record<string, unknown>;
    };

    const _customResourceType = customResource.Type.substring(
      custom_resource_prefix.length
    );

    const codeUriOfTheTargetResource =
      targetTemplate.json.Resources[targetResource]?.Properties.CodeUri;

    const customResourceSchema = codeUriOfTheTargetResource
      ? (codeUriOfTheTargetResource[keywordFunction.keyword] as FunctionType)
          ?.customResources[_customResourceType]
      : undefined;

    if (customResourceSchema === undefined) {
      errors.push(
        new Error(
          `Unable to find the schema for the custom resource ${_customResourceType}. The custom resource function ${targetResource} must define the schema for the custom resource.`
        )
      );
    } else {
      delete customResource.Properties.ServiceToken;
      try {
        const violations = await validate(
          customResourceSchema as JSONSchema7,
          customResource.Properties
        );
        if (violations.length > 0) {
          errors.push(
            new Error(
              `Custom Resource ${
                path[1]
              } has following validation errors\n${violations
                .map(v => `${v.path} ${v.message}`.trim())
                .join("\n")}`
            )
          );
        }
      } catch (e) {
        errors.push(e);
      }
    }
  }

  return errors;
};

export const getDeclaredFunctions = (
  serverlessTemplate: ServerlessTemplate
) => {
  const functionExcludes: { name: string; exclude: string[] }[] = [];
  Object.values(serverlessTemplate.Resources).forEach(resource => {
    if (resource.Type == resourceType_Function) {
      const fun = resource.Properties.CodeUri?.[
        keywordFunction.keyword
      ] as FunctionType;
      const functionName = fun?.name;
      if (functionName) {
        const exclude = fun?.exclude || [];
        functionExcludes.push({ name: functionName, exclude });
      }
    }
  });
  return functionExcludes;
};
