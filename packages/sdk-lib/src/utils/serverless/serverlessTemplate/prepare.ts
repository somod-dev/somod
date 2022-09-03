import { KeywordDefinition, KeywordProcessor } from "@somod/types";
import { parseJson, processKeywords } from "../../jsonTemplate";
import { listAllOutputs } from "../namespace";

import {
  ModuleServerlessTemplateMap,
  SAMTemplate,
  ServerlessTemplate
} from "../types";
import { attachBaseLayer } from "./attachBaseLayer";
import { extendResources } from "./extendResources";
import { getBaseKeywords, getModuleContentMap } from "./serverlessTemplate";

export const prepareSamTemplate = async (
  dir: string,
  moduleNames: string[],
  moduleTemplateMap: ModuleServerlessTemplateMap,
  pluginKeywords: KeywordDefinition[] = []
) => {
  const moduleContentMap = getModuleContentMap(moduleTemplateMap);
  const processedTemplateMap: Record<string, ServerlessTemplate> = {};

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

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
              moduleContentMap
            );

            keywordProcessors[keyword.keyword] = processor;
          })
        );

        const processedTemplate = processKeywords(
          parseJson(moduleContentMap[moduleName].json),
          keywordProcessors
        ) as SAMTemplate;

        samTemplate.Resources = {
          ...samTemplate.Resources,
          ...processedTemplate.Resources
        };

        processedTemplateMap[moduleName] = processedTemplate;
      }
    })
  );

  const outputToModuleMap = await listAllOutputs();
  const outputNames = Object.keys(outputToModuleMap);
  if (outputNames.length > 0) {
    samTemplate.Outputs = {};
    outputNames.forEach(outputName => {
      const moduleName = outputToModuleMap[outputName];
      const output = processedTemplateMap[moduleName].Outputs[
        outputName
      ] as SAMTemplate["Outputs"][string];
      samTemplate.Outputs[outputName] = output;
    });
  }

  if (Object.keys(samTemplate.Outputs).length == 0) {
    delete samTemplate.Outputs;
  }

  extendResources(samTemplate);
  await attachBaseLayer(samTemplate);

  return samTemplate;
};
