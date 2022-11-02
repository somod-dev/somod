import { NamespaceLoader } from "somod-types";
import { countBy } from "lodash";
import {
  namespace_api_gateway,
  namespace_output,
  resourceType_Function
} from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { keywordRef } from "./keywords/ref";
import { ServerlessTemplateHandler } from "./serverlessTemplate/serverlessTemplate";

const detectDuplicateNamespaces = (
  namespaces: string[],
  namespaceType: string,
  moduleName: string
) => {
  const namespaceCounts = countBy(namespaces);
  const repeatedNamespaces: string[] = [];
  for (const namespace in namespaceCounts) {
    if (namespaceCounts[namespace] > 1) {
      repeatedNamespaces.push(namespace);
    }
  }
  if (repeatedNamespaces.length > 0) {
    throw new Error(
      `Following routes for ${namespaceType} are repeated in ${moduleName}\n${repeatedNamespaces
        .map(a => " - " + a)
        .join("\n")}`
    );
  }
};

// must match to the schema of function resource
type FunctionResourceProperties = Record<string, unknown> & {
  Events?: Record<
    string,
    | {
        Type: "Api";
        Properties: Record<string, unknown> & {
          Method: string;
          Path: string;
          RestApiId: {
            "SOMOD::Ref": {
              module?: string;
              resource: string;
            };
          };
        };
      }
    | {
        Type: "HttpApi";
        Properties: Record<string, unknown> & {
          Method: string;
          Path: string;
          ApiId: {
            "SOMOD::Ref": {
              module?: string;
              resource: string;
            };
          };
        };
      }
  >;
};

export const loadApiRouteNamespaces: NamespaceLoader = async module => {
  const namespaces: Record<string, string[]> = {};
  const moduleServerlessTemplate =
    await ServerlessTemplateHandler.getServerlessTemplateHandler().getTemplate(
      module.name
    );

  if (moduleServerlessTemplate) {
    const serverlessTemplate = moduleServerlessTemplate.template;

    Object.values(serverlessTemplate.Resources).forEach(resource => {
      if (resource.Type == resourceType_Function) {
        const resourceProperties =
          resource.Properties as FunctionResourceProperties;
        Object.values(resourceProperties.Events || {}).forEach(event => {
          let apiRef: {
            module?: string;
            resource: string;
          };
          if (event.Type == "HttpApi") {
            apiRef = event.Properties.ApiId[keywordRef.keyword];
          } else if (event.Type == "Api") {
            apiRef = event.Properties.RestApiId[keywordRef.keyword];
          }

          if (apiRef) {
            const apiNamespaceName = `${namespace_api_gateway} ${
              apiRef.module || module.name
            } ${apiRef.resource}`;
            if (!namespaces[apiNamespaceName]) {
              namespaces[apiNamespaceName] = [];
            }
            namespaces[apiNamespaceName].push(
              `${event.Properties.Method} ${event.Properties.Path}`
            );
          }
        });
      }
    });

    Object.keys(namespaces).forEach(apiNamespaceName => {
      detectDuplicateNamespaces(
        namespaces[apiNamespaceName],
        apiNamespaceName,
        module.name
      );
    });
  }

  return namespaces;
};

export const loadOutputNamespaces: NamespaceLoader = async module => {
  const namespaces = [];
  const moduleServerlessTemplate =
    await ServerlessTemplateHandler.getServerlessTemplateHandler().getTemplate(
      module.name
    );

  if (moduleServerlessTemplate) {
    const serverlessTemplate = moduleServerlessTemplate.template;

    namespaces.push(...Object.keys(serverlessTemplate.Outputs || {}));
  }

  return { [namespace_output]: namespaces };
};

export const listAllOutputs = async () => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const namespaces = await moduleHandler.getNamespaces();
  return namespaces[namespace_output] || {};
};
