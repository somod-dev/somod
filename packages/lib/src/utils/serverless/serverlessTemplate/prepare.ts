import { IContext, KeywordProcessor, ServerlessTemplate } from "somod-types";
import { parseJson, processKeywords } from "../../jsonTemplate";
import { listAllOutputs } from "../namespace";

import { SAMTemplate } from "../types";
import { getBaseKeywords } from "./serverlessTemplate";

export const prepareSamTemplate = async (context: IContext) => {
  const processedTemplateMap: Record<string, ServerlessTemplate> = {};

  const keywords = [
    ...getBaseKeywords(),
    ...context.lifecycleHandler.serverlessKeywords.map(k => k.keyword)
  ];

  const samTemplate: SAMTemplate = {
    Resources: {}
  };

  const _moduleNames = (await context.moduleHandler.listModules()).map(
    m => m.module.name
  );

  _moduleNames.reverse();

  const templates = await context.serverlessTemplateHandler.listTemplates();
  const moduleTemplateMap = Object.fromEntries(
    templates.map(t => [t.module, t.template])
  );

  await Promise.all(
    _moduleNames.map(async moduleName => {
      if (moduleTemplateMap[moduleName]) {
        const keywordProcessors: Record<string, KeywordProcessor> = {};

        await Promise.all(
          keywords.map(async keyword => {
            const processor = await keyword.getProcessor(moduleName, context);
            keywordProcessors[keyword.keyword] = processor;
          })
        );

        const processedTemplate = (await processKeywords(
          parseJson(moduleTemplateMap[moduleName]),
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
      const samOutputName = context.getSAMOutputName(outputName);
      const output = processedTemplateMap[moduleName].Outputs[
        samOutputName
      ] as SAMTemplate["Outputs"][string];
      samTemplate.Outputs[samOutputName] = output;
    });
  }

  return samTemplate;
};
