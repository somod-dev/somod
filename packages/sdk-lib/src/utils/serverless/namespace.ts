import { countBy } from "lodash";
import { namespace_http_api, resourceType_Function } from "../constants";
import { NamespaceLoader } from "../moduleHandler";
import { loadServerlessTemplate } from "./serverlessTemplate/serverlessTemplate";

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
      `Following ${namespaceType} are repeated in ${moduleName}\n${repeatedNamespaces
        .map(a => " - " + a)
        .join("\n")}`
    );
  }
};

// must match to the schema of function resource
type FunctionResourceProperties = Record<string, unknown> & {
  Events?: Record<
    string,
    {
      Type: string;
      Properties: Record<string, unknown> & {
        Method: string;
        Path: string;
      };
    }
  >;
};

export const loadHttpApiNamespaces: NamespaceLoader = async module => {
  const namespaces = [];
  const moduleServerlessTemplate = await loadServerlessTemplate(module);

  if (moduleServerlessTemplate) {
    const serverlessTemplate = moduleServerlessTemplate.template;

    Object.values(serverlessTemplate.Resources).forEach(resource => {
      if (resource.Type == resourceType_Function) {
        const resourceProperties =
          resource.Properties as FunctionResourceProperties;
        Object.values(resourceProperties.Events || {}).forEach(event => {
          if (event.Type == "HttpApi") {
            namespaces.push(
              `${event.Properties.Method} ${event.Properties.Path}`
            );
          }
        });
      }
    });

    detectDuplicateNamespaces(namespaces, namespace_http_api, module.name);
  }

  return { [namespace_http_api]: namespaces };
};
