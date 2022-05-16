import { writeFile } from "fs/promises";
import { join } from "path";
import { file_nextConfigJs, file_njpConfigJson } from "../../utils/constants";

export const createNextConfigJs = async (dir: string): Promise<void> => {
  await writeFile(
    join(dir, file_nextConfigJs),
    `/* eslint-disable */

  const fs = require("fs");
  const path = require("path");
  
  const njpConfigStr = fs.readFileSync(path.join(__dirname, "${file_njpConfigJson}"), {
    encoding: "utf8"
  });
  
  const njpConfig = JSON.parse(njpConfigStr);
  
  module.exports = njpConfig;
  `
  );
};
