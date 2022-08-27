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
    Resources: {}
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
              // @ts-expect-error the type error in the next line is expected
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
      }
    })
  );

  extendResources(samTemplate);
  await attachBaseLayer(samTemplate);

  return samTemplate;
};
