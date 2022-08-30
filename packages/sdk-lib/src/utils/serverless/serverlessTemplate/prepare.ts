import {
  JSONType,
  KeywordProcessor,
  parseJson,
  processKeywords
} from "../../jsonTemplate";

import { ModuleServerlessTemplateMap, SAMTemplate } from "../types";
import { attachBaseLayer } from "./attachBaseLayer";
import { extendResources } from "./extendResources";
import { getKeywords, getModuleContentMap } from "./serverlessTemplate";

export const prepareSamTemplate = async (
  dir: string,
  moduleNames: string[],
  moduleTemplateMap: ModuleServerlessTemplateMap
) => {
  const moduleContentMap = getModuleContentMap(moduleTemplateMap);

  const keywords = getKeywords();

  const samTemplate: SAMTemplate = {
    Resources: {},
    Outputs: {}
  };

  const _moduleNames = [...moduleNames].reverse();

  await Promise.all(
    _moduleNames.map(async moduleName => {
      if (moduleTemplateMap[moduleName]) {
        const keywordProcessors: Record<string, KeywordProcessor> = {};

        await Promise.all(
          keywords.map(async keyword => {
            const processor = await keyword.getProcessor(
              dir,
              moduleName,
              moduleContentMap
            );

            keywordProcessors[keyword.keyword] = processor;
          })
        );

        const processedTemplate = processKeywords(
          parseJson(moduleContentMap[moduleName].json as JSONType),
          keywordProcessors
        ) as SAMTemplate;

        samTemplate.Resources = {
          ...samTemplate.Resources,
          ...processedTemplate.Resources
        };

        samTemplate.Outputs = {
          ...samTemplate.Outputs,
          ...processedTemplate.Outputs
        };
      }
    })
  );

  if (Object.keys(samTemplate.Outputs).length == 0) {
    delete samTemplate.Outputs;
  }

  extendResources(samTemplate);
  await attachBaseLayer(samTemplate);

  return samTemplate;
};
