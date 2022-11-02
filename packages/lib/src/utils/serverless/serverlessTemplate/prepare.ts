import {
  KeywordDefinition,
  KeywordProcessor,
  ServerlessTemplate
} from "somod-types";
import { parseJson, processKeywords } from "../../jsonTemplate";
import { ModuleHandler } from "../../moduleHandler";
import { listAllOutputs } from "../namespace";

import { SAMTemplate } from "../types";
import {
  getBaseKeywords,
  getModuleServerlessTemplateMap,
  ServerlessTemplateHandler
} from "./serverlessTemplate";

export const prepareSamTemplate = async (
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
) => {
  const moduleTemplateMap = await getModuleServerlessTemplateMap();
  const processedTemplateMap: Record<string, ServerlessTemplate> = {};

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

  const samTemplate: SAMTemplate = {
    Resources: {}
  };

  const _moduleNames = (
    await ModuleHandler.getModuleHandler().listModules()
  ).map(m => m.module.name);

  _moduleNames.reverse();

  await Promise.all(
    _moduleNames.map(async moduleName => {
      if (moduleTemplateMap[moduleName]) {
        const keywordProcessors: Record<string, KeywordProcessor> = {};

        await Promise.all(
          keywords.map(async keyword => {
            const processor = await keyword.getProcessor(
              dir,
              moduleName,
              moduleTemplateMap
            );

            keywordProcessors[keyword.keyword] = processor;
          })
        );

        const processedTemplate = (await processKeywords(
          parseJson(moduleTemplateMap[moduleName].json),
          keywordProcessors
        )) as SAMTemplate;

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
      const samOutputName =
        ServerlessTemplateHandler.getServerlessTemplateHandler().getSAMOutputName(
          outputName
        );
      const output = processedTemplateMap[moduleName].Outputs[
        samOutputName
      ] as SAMTemplate["Outputs"][string];
      samTemplate.Outputs[samOutputName] = output;
    });
  }

  return samTemplate;
};
