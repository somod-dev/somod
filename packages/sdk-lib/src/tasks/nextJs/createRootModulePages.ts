import { existsSync } from "fs";
import { join } from "path";
import { path_pages, path_ui } from "../../utils/constants";
import { listFiles } from "@solib/cli-base";
import { exportRootModulePage } from "../../utils/pages";

export const createRootModulePages = async (dir: string): Promise<void> => {
  const uiPagesDir = join(dir, path_ui, path_pages);
  if (existsSync(uiPagesDir)) {
    const pages = await listFiles(uiPagesDir);
    await Promise.all(
      pages.map(async page => {
        await exportRootModulePage(dir, page);
      })
    );
  }
};
