import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import {
  file_index_dts,
  file_index_js,
  file_pageIndex_js,
  path_build,
  path_lib,
  path_ui
} from "../../utils/constants";

export const generateIndex = async (dir: string): Promise<void> => {
  const statements: string[] = [];
  if (existsSync(join(dir, path_build, path_ui, file_pageIndex_js))) {
    statements.push(
      `export * from "./${path_ui}/${file_pageIndex_js.substr(
        0,
        file_pageIndex_js.length - ".js".length
      )}";`
    );
  }

  if (existsSync(join(dir, path_build, path_lib, file_index_js))) {
    statements.push(`export * from "./${path_lib}";`);
  }

  if (statements.length > 0) {
    await writeFile(
      join(dir, path_build, file_index_js),
      statements.join("\n")
    );
    await writeFile(
      join(dir, path_build, file_index_dts),
      statements.join("\n")
    );
  }
};
