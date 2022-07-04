import { existsSync } from "fs";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { namespace_page, path_build, path_pages, path_ui } from "../constants";
import { Module, ModuleHandler } from "../moduleHandler";
import { get as getExports } from "../exports";
import { unixStylePath } from "@solib/cli-base";

export const addPageExtention = (pagePathWithoutExtension: string) => {
  let extension = "";
  if (existsSync(pagePathWithoutExtension + ".js")) {
    extension = ".js";
  } else if (existsSync(pagePathWithoutExtension + ".tsx")) {
    extension = ".tsx";
  } else {
    throw new Error(
      `Could not find supported extention for ${pagePathWithoutExtension}`
    );
  }
  return pagePathWithoutExtension + extension;
};

export const linkPage = async (
  fromPage: string,
  toPage: string
): Promise<void> => {
  const exports = getExports(fromPage);

  const relativePagePath = unixStylePath(relative(dirname(toPage), fromPage));
  const relativePageModule = relativePagePath.substring(
    0,
    relativePagePath.lastIndexOf(".")
  );

  const _exports: string[] = [];
  if (exports.default) {
    _exports.push("default");
  }
  _exports.push(...exports.named);

  const pageContent = `export { ${_exports.join(
    ", "
  )} } from "${relativePageModule}";`;

  await mkdir(dirname(toPage), { recursive: true });
  await writeFile(toPage, pageContent);
};

export const loadPageNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_page]) {
    const baseDir = join(
      module.packageLocation,
      module.root ? "" : path_build,
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
            } else if (child.endsWith(".js") || child.endsWith(".tsx")) {
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

export const listAllPages = async (dir: string, moduleIndicators: string[]) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const pageToModuleMap = (
    await moduleHandler.getNamespaces(
      Object.fromEntries(moduleIndicators.map(mt => [mt, loadPageNamespaces]))
    )
  )[namespace_page];

  return pageToModuleMap;
};
