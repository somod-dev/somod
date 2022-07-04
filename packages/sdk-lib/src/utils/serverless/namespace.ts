import { countBy } from "lodash";
import {
  namespace_export_parameter,
  namespace_http_api,
  resourceType_Function
} from "../constants";
import { Module } from "../moduleHandler";
import { loadOriginalSlpTemplate, NoSLPTemplateError } from "./slpTemplate";
import { KeywordSLPOutput } from "./types";

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

export const loadHttpApiNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_http_api]) {
    const namespaces = [];
    try {
      const originalSlpTemplate = await loadOriginalSlpTemplate(module);

      Object.values(originalSlpTemplate.Resources).forEach(resource => {
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
    } catch (e) {
      if (!(e instanceof NoSLPTemplateError)) {
        throw e;
      }
    }
    module.namespaces[namespace_http_api] = namespaces;
  }
};

export const loadExportParameterNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_export_parameter]) {
    const namespaces = [];
    try {
      const originalSlpTemplate = await loadOriginalSlpTemplate(module);

      Object.values(originalSlpTemplate.Resources).forEach(resource => {
        if (resource[KeywordSLPOutput] && resource[KeywordSLPOutput].export) {
          namespaces.push(...Object.values(resource[KeywordSLPOutput].export));
        }
      });

      detectDuplicateNamespaces(
        namespaces,
        namespace_export_parameter,
        module.name
      );
    } catch (e) {
      if (!(e instanceof NoSLPTemplateError)) {
        throw e;
      }
    }
    module.namespaces[namespace_export_parameter] = namespaces;
  }
};
