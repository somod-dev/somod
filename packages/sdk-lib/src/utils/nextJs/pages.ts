import { unixStylePath } from "@solib/cli-base";
import { existsSync } from "fs";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { namespace_page, path_build, path_pages, path_ui } from "../constants";
import { get as getExports } from "../exports";
import { Module } from "../moduleHandler";

const getRelativePath = (dir: string, page: string): string => {
  const toPage = join(dir, path_ui, path_pages, page);
  const fromPage = join(dir, path_pages, page);
  const fromPageDir = dirname(fromPage);
  const relativePath = relative(fromPageDir, toPage);
  const relativePathWoExtension = relativePath.substring(
    0,
    relativePath.lastIndexOf(".")
  );
  return unixStylePath(relativePathWoExtension);
};

export const exportRootModulePage = async (
  dir: string,
  page: string
): Promise<void> => {
  const module = getRelativePath(dir, page);
  const exports = getExports(join(dir, path_ui, path_pages, page));
  const targetPage = join(dir, path_pages, page);
  const targetPageTs =
    targetPage.substring(0, targetPage.lastIndexOf(".")) + ".ts";

  const targetPageTsDir = dirname(targetPageTs);
  await mkdir(targetPageTsDir, { recursive: true });

  const _exports: string[] = [];
  if (exports.default) {
    _exports.push("default");
  }
  exports.named.forEach(namedExport => {
    _exports.push(namedExport);
  });

  await writeFile(
    targetPageTs,
    `export { ${_exports.join(", ")} } from "${module}";`
  );
};

export const loadPageNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_page]) {
    const baseDir = join(
      module.packageLocation,
      path_build,
      path_ui,
      path_pages
    );
    const pages: string[] = [];

    if (existsSync(baseDir)) {
      const queue: string[] = [""];

      while (queue.length > 0) {
        const dirToParse = queue.shift();
        const children = await readdir(join(baseDir, dirToParse));
        await Promise.all(
          children.map(async child => {
            const stats = await stat(join(baseDir, dirToParse, child));
            if (stats.isDirectory()) {
              queue.push(dirToParse + "/" + child);
            } else if (child.endsWith(".js")) {
              pages.push(
                dirToParse + "/" + child.substring(0, child.lastIndexOf("."))
              );
            }
          })
        );
      }
    }

    module.namespaces[namespace_page] = pages.map(page =>
      page.startsWith("/") ? page.substring(1) : page
    );
  }
};
