import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { prepeareServerlessRootFunctionsForBundling } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task prepeareServerlessRootFunctionsForBundling", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no functions", async () => {
    createFiles(dir, {
      "build/serverless/functions/": "",
      "package.json": JSON.stringify({ name: "@my-scope/sample" })
    });
    await expect(
      prepeareServerlessRootFunctionsForBundling(dir)
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, ".slp"))).not.toBeTruthy();
  });

  test("for valid functions", async () => {
    createFiles(dir, {
      "build/serverless/functions/a.js": "const x = 100; export default x;",
      "build/serverless/functions/b.js":
        'export { y as default } from "dependency1";',
      "build/serverless/functionIndex.js":
        'export { default as a } from "./functions/a";\nexport { default as b } from "./functions/b";',
      "build/index.js": 'export * from "./serverless/functionIndex"',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/build/index.js": "export const y = 10;",
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      prepeareServerlessRootFunctionsForBundling(dir)
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, ".slp/functions/sample/a.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual('export { a as default } from "../../../build";');
    await expect(
      readFile(join(dir, ".slp/functions/sample/b.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual('export { b as default } from "../../../build";');
  });
});
