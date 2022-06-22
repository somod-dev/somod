import { ErrorSet, listFiles } from "@solib/cli-base";
import { existsSync } from "fs";
import { join } from "path";
import { path_pages, path_ui } from "../../utils/constants";
import { get as getExports } from "../../utils/exports";

export const doesPagesHaveDefaultExport = async (
  dir: string
): Promise<void> => {
  const errors: Error[] = [];
  const pagesDir = join(dir, path_ui, path_pages);
  if (existsSync(pagesDir)) {
    const pages = await listFiles(dir, ".ts");

    pages.forEach(page => {
      const pagePath = join(pagesDir, page);
      const exports = getExports(pagePath);
      if (!exports.default) {
        errors.push(new Error(`${pagePath} must have a default export`));
      }
    });
  }

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
