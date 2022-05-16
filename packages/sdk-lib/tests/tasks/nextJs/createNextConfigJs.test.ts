import { readFile } from "fs/promises";
import { join } from "path";
import { createNextConfigJs } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task createNextConfigJs", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("without prior file", async () => {
    await expect(createNextConfigJs(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "next.config.js"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual(`/* eslint-disable */

  const fs = require("fs");
  const path = require("path");
  
  const njpConfigStr = fs.readFileSync(path.join(__dirname, "njp.config.json"), {
    encoding: "utf8"
  });
  
  const njpConfig = JSON.parse(njpConfigStr);
  
  module.exports = njpConfig;
  `);
  });

  test("with prior file", async () => {
    createFiles(dir, { "next.config.js": "module.exports = {}" });
    await expect(createNextConfigJs(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "next.config.js"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual(`/* eslint-disable */

  const fs = require("fs");
  const path = require("path");
  
  const njpConfigStr = fs.readFileSync(path.join(__dirname, "njp.config.json"), {
    encoding: "utf8"
  });
  
  const njpConfig = JSON.parse(njpConfigStr);
  
  module.exports = njpConfig;
  `);
  });
});
