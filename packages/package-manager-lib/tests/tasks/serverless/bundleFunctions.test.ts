import { readFile } from "fs/promises";
import { join } from "path";
import { bundleServerlessFunctions } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task bundleServerlessFunctions", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for valid functions", async () => {
    createFiles(dir, {
      ".slp/functions/sample/a.js":
        'export { a as default } from "../../../build";',
      ".slp/functions/dependency2/b.js":
        'export { b as default } from "dependency2";',
      "build/index.js": "export const a = 100;\nexport const x = 200;",
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false,
        dependencies: { dependency2: "^1.0.0" }
      }),
      "node_modules/dependency2/build/index.js":
        "export const b = 10;\nexport const c = 20;",
      "node_modules/dependency2/package.json": JSON.stringify({
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(bundleServerlessFunctions(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, ".slp/lambdas/sample/a/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      'var e=Object.defineProperty;var x=o=>e(o,"__esModule",{value:!0});var s=typeof require!="undefined"?require:o=>{throw new Error(\'Dynamic require of "\'+o+\'" is not supported\')};var p=(o,t)=>{x(o);for(var a in t)e(o,a,{get:t[a],enumerable:!0})};p(exports,{default:()=>r});var r=100;0&&(module.exports={});\n'
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
      readFile(join(dir, ".slp/lambdas/dependency2/b/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      'var c=Object.defineProperty;var p=e=>c(e,"__esModule",{value:!0});var d=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)c(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n'
    );
    await expect(
      readFile(join(dir, ".slp/lambdas/dependency2/b/package.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "dependency2-b",
          version: "1.0.0",
          description:
            "AWS Lambda function, auto created from b function in dependency2 module"
        },
        null,
        2
      )
    );
  });
});
