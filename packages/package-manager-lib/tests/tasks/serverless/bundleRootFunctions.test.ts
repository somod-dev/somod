import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleRootServerlessFunctions } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task bundleRootServerlessFunctions", () => {
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
    await expect(bundleRootServerlessFunctions(dir)).resolves.toBeUndefined();
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
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(bundleRootServerlessFunctions(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, ".slp/lambdas/sample/a/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      'var r=Object.defineProperty;var a=e=>r(e,"__esModule",{value:!0});var d=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var n=(e,t)=>{a(e);for(var f in t)r(e,f,{get:t[f],enumerable:!0})};n(exports,{default:()=>o});var s=100,o=s;0&&(module.exports={});\n'
    );
    await expect(
      readFile(join(dir, ".slp/lambdas/sample/a/package.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "sample-a",
          version: "1.0.0",
          description:
            "AWS Lambda function, auto created from a function in sample module"
        },
        null,
        2
      )
    );

    await expect(
      readFile(join(dir, ".slp/lambdas/sample/b/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      'var f=Object.defineProperty;var a=e=>f(e,"__esModule",{value:!0});var s=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var n=(e,t)=>{a(e);for(var r in t)f(e,r,{get:t[r],enumerable:!0})};n(exports,{default:()=>o});var o=10;0&&(module.exports={});\n'
    );
    await expect(
      readFile(join(dir, ".slp/lambdas/sample/b/package.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "sample-b",
          version: "1.0.0",
          description:
            "AWS Lambda function, auto created from b function in sample module"
        },
        null,
        2
      )
    );
  });
});
