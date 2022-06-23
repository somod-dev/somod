import { join } from "path";
import {
  namespace_page,
  path_build,
  path_pages,
  path_ui
} from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { addPageExtention, linkPage } from "../../utils/nextJs/pages";
import { loadNamespaces } from "./namespace";

export const createPages = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await loadNamespaces(dir, moduleIndicators);

  const allPages = namespaces[namespace_page];

  await Promise.all(
    Object.keys(allPages).map(async page => {
      const moduleName = allPages[page];
      const moduleNode = await moduleHandler.getModule(moduleName);
      const packageLocation = moduleNode.module.packageLocation;

      const sourcePagePath = addPageExtention(
        join(
          packageLocation,
          moduleNode.module.root ? "" : path_build,
          path_ui,
          path_pages,
          page
        )
      );

      const pagePath = join(dir, path_pages, page + ".ts");
      await linkPage(sourcePagePath, pagePath);
    })
  );
};
