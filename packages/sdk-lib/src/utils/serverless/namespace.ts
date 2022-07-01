import { countBy } from "lodash";
import { namespace_http_api, resourceType_Function } from "../constants";
import { Module } from "../moduleHandler";
import { loadOriginalSlpTemplate, NoSLPTemplateError } from "./slpTemplate";

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

      const apiCounts = countBy(namespaces);
      const repeatedApis: string[] = [];
      for (const api in apiCounts) {
        if (apiCounts[api] > 1) {
          repeatedApis.push(api);
        }
      }
      if (repeatedApis.length > 0) {
        throw new Error(
          `Following apis are repeated in ${module.name}\n${repeatedApis
            .map(a => " - " + a)
            .join("\n")}`
        );
      }
    } catch (e) {
      if (!(e instanceof NoSLPTemplateError)) {
        throw e;
      }
    }
    module.namespaces[namespace_http_api] = namespaces;
  }
};
