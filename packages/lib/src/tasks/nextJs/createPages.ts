import { join } from "path";
import { IContext } from "somod-types";
import {
  path_build,
  path_pages,
  path_pagesData,
  path_ui
} from "../../utils/constants";
import {
  addPageExtention,
  linkPage,
  getPageToModuleMap
} from "../../utils/nextJs/pages";

export const createPages = async (context: IContext): Promise<void> => {
  const allPages = getPageToModuleMap(context);

  await Promise.all(
    Object.keys(allPages).map(async page => {
      const moduleName = allPages[page];
      const moduleNode = context.moduleHandler.getModule(moduleName);
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

      const sourcePageDataPath = join(
        packageLocation,
        moduleNode.module.root ? "" : path_build,
        path_ui,
        path_pagesData,
        page + (moduleNode.module.root ? ".ts" : ".js")
      );

      const pagePath = join(context.dir, path_pages, page + ".ts");
      await linkPage(sourcePagePath, sourcePageDataPath, pagePath);
    })
  );
};
