import { existsSync } from "fs";
import { join } from "path";
import { writeFile } from "fs/promises";
import {
  get as getExports,
  generateExportStatement
} from "../../utils/exports";
import { listFiles } from "../../utils/fileUtils";
import {
  file_pagesJson,
  file_pageIndex_dts,
  file_pageIndex_js,
  path_build,
  path_pages,
  path_ui
} from "../../utils/constants";
import { Pages } from "../../utils/pages";

const generateStatements = async (
  dir: string
): Promise<{
  dTsStatements: string[];
  jsStatements: string[];
  pages: Pages;
}> => {
  const buildUiDir = join(dir, path_build, path_ui);
  const declarations = await listFiles(join(buildUiDir, path_pages), "d.ts");

  const dTsStatements: string[] = [];
  const jsStatements: string[] = [];
  const pages: Pages = {};

  declarations.forEach((declaration, i) => {
    const modulePath =
      "./" +
      path_pages +
      "/" +
      declaration.substr(0, declaration.length - ".d.ts".length);
    const declarationExports = getExports(
      join(buildUiDir, modulePath + ".d.ts")
    );
    const jsExports = getExports(join(buildUiDir, modulePath + ".js"));

    const prefix = `Page${i + 1}`;
    dTsStatements.push(
      generateExportStatement(modulePath, prefix, declarationExports)
    );
    jsStatements.push(generateExportStatement(modulePath, prefix, jsExports));

    pages[modulePath] = { prefix, exports: declarationExports };
  });

  return { dTsStatements, jsStatements, pages };
};

export const generatePageIndex = async (dir: string): Promise<void> => {
  if (existsSync(join(dir, path_build, path_ui, path_pages))) {
    const { dTsStatements, jsStatements, pages } = await generateStatements(
      dir
    );
    if (dTsStatements.length > 0) {
      await Promise.all([
        writeFile(
          join(dir, path_build, path_ui, file_pageIndex_js),
          jsStatements.join("\n")
        ),
        writeFile(
          join(dir, path_build, path_ui, file_pageIndex_dts),
          dTsStatements.join("\n")
        ),
        writeFile(
          join(dir, path_build, path_ui, file_pagesJson),
          JSON.stringify(pages, null, 2)
        )
      ]);
    }
  }
};
