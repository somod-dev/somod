import { IContext, KeywordProcessor, ServerlessTemplate } from "somod-types";
import { parseJson, processKeywords } from "../../jsonTemplate";
import { getOutputToModuleMap } from "../namespace";

import { SAMTemplate } from "../types";
import { getBaseKeywords } from "./serverlessTemplate";
import { keywordExtend } from "../keywords/extend";

export const prepareSamTemplate = async (context: IContext) => {
  const processedTemplateMap: Record<string, ServerlessTemplate> = {};

  const keywords = [...getBaseKeywords()];
  context.extensionHandler.serverlessTemplateKeywords.forEach(k => {
    keywords.push(...k.value);
  });

  const samTemplate: SAMTemplate = {
    Resources: {}
  };

  const _moduleNames = context.moduleHandler.list.map(m => m.module.name);

  _moduleNames.reverse();

  const templates = context.serverlessTemplateHandler.listTemplates();
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

        const originalTemplate = moduleTemplateMap[moduleName];
        const template = {
          Resources: Object.fromEntries(
            Object.keys(originalTemplate.Resources)
              .filter(
                resource =>
                  originalTemplate.Resources[resource][
                    keywordExtend.keyword
                  ] === undefined
              )
              .map(resource => [
                resource,
                context.serverlessTemplateHandler.getResource(
                  moduleName,
                  resource
                ).resource
              ])
          )
        };
        if (originalTemplate.Outputs !== undefined) {
          template["Outputs"] = originalTemplate.Outputs;
        }

        const processedTemplate = (await processKeywords(
          parseJson(template),
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

  const outputToModuleMap = getOutputToModuleMap(context);
  const outputNames = Object.keys(outputToModuleMap);
  if (outputNames.length > 0) {
    samTemplate.Outputs = {};
    outputNames.forEach(outputName => {
      const moduleName = outputToModuleMap[outputName];
      const samOutputName =
        context.serverlessTemplateHandler.getSAMOutputName(outputName);
      const output = processedTemplateMap[moduleName].Outputs[
        samOutputName
      ] as SAMTemplate["Outputs"][string];
      samTemplate.Outputs[samOutputName] = output;
    });
  }

  return samTemplate;
};
