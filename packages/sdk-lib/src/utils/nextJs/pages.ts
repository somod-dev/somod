import { existsSync } from "fs";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { namespace_page, path_build, path_pages, path_ui } from "../constants";
import { ModuleHandler, NamespaceLoader } from "../moduleHandler";
import { get as getExports } from "../exports";
import { unixStylePath } from "@solib/cli-base";

export const removeExtension = (pagePathWithExtension: string) => {
  let extension = "";
  if (pagePathWithExtension.endsWith(".js")) {
    extension = ".js";
  } else if (pagePathWithExtension.endsWith(".tsx")) {
    extension = ".tsx";
  } else {
    throw new Error(
      `Could not find supported extention for ${pagePathWithExtension}`
    );
  }
  return pagePathWithExtension.substring(
    0,
    pagePathWithExtension.length - extension.length
  );
};

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
  fromPageData: string,
  toPage: string
): Promise<void> => {
  getExports(fromPage);
  const relativePagePath = unixStylePath(relative(dirname(toPage), fromPage));
  const relativePageModule = relativePagePath.substring(
    0,
    relativePagePath.lastIndexOf(".")
  );

  let pageContent = `export { default } from "${relativePageModule}";`;

  if (existsSync(fromPageData)) {
    const exports = getExports(fromPageData);
    if (exports.named.length > 0) {
      const relativePageDataPath = unixStylePath(
        relative(dirname(toPage), fromPageData)
      );
      const relativePageDataModule = relativePageDataPath.substring(
        0,
        relativePageDataPath.lastIndexOf(".")
      );

      pageContent += "\n";
      pageContent += `export { ${exports.named.join(
        ", "
      )} } from "${relativePageDataModule}";`;
    }
  }

  await mkdir(dirname(toPage), { recursive: true });
  await writeFile(toPage, pageContent);
};

export const loadPageNamespaces: NamespaceLoader = async module => {
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
            pages.push(removeExtension(dirToParse + "/" + child));
          }
        })
      );
    }
  }

  return {
    [namespace_page]: pages.map(page =>
      page.startsWith("/") ? page.substring(1) : page
    )
  };
};

export const listAllPages = async () => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const pageToModuleMap = (await moduleHandler.getNamespaces())[namespace_page];

  return pageToModuleMap;
};
