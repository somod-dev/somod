import {
  checkForRepeatedModules,
  getModuleGraph,
  toChildFirstList,
  toList
} from "../module";
import {
  buildRootSLPTemplate,
  loadSLPTemplate,
  mergeSLPTemplates,
  validate
} from "./slpTemplate";

export const buildTemplateJson = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);

  const allModuleNodes = toList(rootModuleNode); // to be improved in module code
  checkForRepeatedModules(allModuleNodes); // to be improved in module code

  const allChildModules = toChildFirstList(rootModuleNode);
  allChildModules.pop(); // remove the root module

  const allChildSlpTemplates = await Promise.all(
    allChildModules.map(childModule => loadSLPTemplate(childModule))
  );

  const rootSlpTemplate = await loadSLPTemplate(rootModuleNode, true);
  const serverlessTemplate = mergeSLPTemplates(allChildSlpTemplates);

  validate(rootSlpTemplate, serverlessTemplate);

  await buildRootSLPTemplate(rootModuleNode);
};
