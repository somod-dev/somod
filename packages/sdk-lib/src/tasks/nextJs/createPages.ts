import { join } from "path";
import { path_build, path_pages, path_ui } from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import {
  addPageExtention,
  linkPage,
  listAllPages
} from "../../utils/nextJs/pages";

export const createPages = async (dir: string): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);

  const allPages = await listAllPages(dir);

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
